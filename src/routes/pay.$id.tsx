import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  findInvoice,
  payInvoice,
  subscribeToInvoiceEvents,
  truncateAddr,
  useWallet,
  type Invoice,
} from "@/lib/stellar";

export const Route = createFileRoute("/pay/$id")({
  component: PayPage,
});

type Status = "idle" | "paying" | "success" | "error";

function PayPage() {
  const { id } = useParams({ from: "/pay/$id" });
  const { address, connect, connecting, balance } = useWallet();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const inv = await findInvoice(id);
        if (mounted) {
          setInvoice(inv || null);
          if (inv?.status === "paid" && status !== "success") {
            if (inv.txHash) setTxHash(inv.txHash);
            setStatus("success");
          }
        }
      } catch (err) {
        console.error("Failed to load invoice:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    // Refresh as soon as the Soroban RPC reports an invoice event.
    const unsubscribe = subscribeToInvoiceEvents(() => {
      if (status !== "success") void load();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [id, status]);

  async function handlePay() {
    if (!invoice) return;
    setStatus("paying");
    setError(null);
    try {
      const { txHash } = await payInvoice(invoice.id);
      setTxHash(txHash);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went sideways");
      setStatus("error");
    }
  }

  function copyHash() {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto mt-16 max-w-md rounded-3xl bg-card p-8 text-center ring-1 ring-border">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Spinner />
            <span className="text-lg font-bold text-muted-foreground">
              Reading invoice details…
            </span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell>
        <div className="mx-auto mt-16 max-w-md rounded-3xl bg-card p-8 text-center ring-1 ring-border">
          <div className="text-5xl">🕵️</div>
          <h1 className="mt-3 text-2xl font-extrabold">Invoice not found</h1>
          <p className="mt-2 text-muted-foreground">
            This link might be old, or the invoice lives on a different device.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto mt-4 max-w-lg">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)] ring-1 ring-border sm:p-8">
          {status === "success" && <Confetti />}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Invoice #{invoice.id}
            </span>
            <StatusPill status={status} />
          </div>

          <div className="mt-5 text-center">
            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Amount due
            </div>
            <div className="mt-2 flex items-baseline justify-center gap-2">
              <span className="max-w-full break-all text-4xl font-extrabold sm:text-6xl">
                {invoice.amount}
              </span>
              <span className="text-base font-bold text-muted-foreground sm:text-xl">XLM</span>
            </div>
            <p className="mt-3 text-foreground/80">"{invoice.description}"</p>
            {invoice.dueDate && (
              <p className="mt-1 text-sm text-muted-foreground">
                Due {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-secondary/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="font-mono font-bold">{truncateAddr(invoice.from)}</span>
            </div>
          </div>

          {status === "success" ? (
            <SuccessState txHash={txHash!} copied={copied} onCopy={copyHash} />
          ) : status === "error" ? (
            <ErrorState message={error} onRetry={handlePay} />
          ) : (
            <div className="mt-6">
              {!address ? (
                <button
                  onClick={connect}
                  disabled={connecting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-extrabold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] disabled:opacity-70"
                >
                  {connecting ? (
                    <>
                      <Spinner /> Connecting…
                    </>
                  ) : (
                    <>
                      <Wallet className="h-5 w-5" /> Connect Wallet
                    </>
                  )}
                </button>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between rounded-2xl bg-[oklch(0.94_0.06_155)] px-4 py-2.5 text-sm font-bold text-[oklch(0.35_0.09_155)]">
                    <span>💰 Your balance</span>
                    <span>{balance.toFixed(2)} XLM</span>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={status === "paying" || Number(invoice.amount) > balance}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-extrabold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "paying" ? (
                      <>
                        <Spinner /> Sending payment…
                      </>
                    ) : Number(invoice.amount) > balance ? (
                      <>Not enough XLM</>
                    ) : (
                      <>Pay {invoice.amount} XLM 🚀</>
                    )}
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" /> Stellar testnet · signed by your wallet
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map = {
    idle: { bg: "bg-warning", fg: "text-warning-foreground", label: "Pending" },
    paying: { bg: "bg-accent", fg: "text-accent-foreground", label: "Sending…" },
    success: { bg: "bg-success", fg: "text-success-foreground", label: "Paid" },
    error: { bg: "bg-destructive", fg: "text-destructive-foreground", label: "Retry" },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${map.bg} ${map.fg}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {map.label}
    </span>
  );
}

function SuccessState({
  txHash,
  copied,
  onCopy,
}: {
  txHash: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="animate-pop-in mt-6 rounded-2xl bg-[oklch(0.96_0.06_155)] p-5 text-center ring-1 ring-[oklch(0.85_0.1_155)]">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[oklch(0.72_0.15_155)] text-white shadow-[var(--shadow-soft)]">
        <Check className="h-8 w-8" strokeWidth={3} />
      </div>
      <h3 className="mt-3 text-xl font-extrabold text-[oklch(0.3_0.1_155)]">
        Payment successful! 🎉
      </h3>
      <p className="mt-1 text-sm text-[oklch(0.35_0.08_155)]">
        Nice work — the sender will thank you.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 ring-1 ring-border">
        <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{txHash}</span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-bold text-background transition hover:-translate-y-0.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>

      <a
        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
      >
        View on Stellar Expert <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-2xl bg-[oklch(0.97_0.04_45)] p-5 text-center ring-1 ring-[oklch(0.88_0.08_45)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[oklch(0.9_0.09_45)] text-[oklch(0.5_0.15_45)]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-lg font-extrabold text-[oklch(0.4_0.12_45)]">
        Payment didn't go through
      </h3>
      <p className="mt-1 text-sm text-[oklch(0.45_0.1_45)]">
        {message || "No worries — your funds are safe. Give it another go?"}
      </p>
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-bold text-background transition hover:-translate-y-0.5"
      >
        <RotateCcw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-primary-foreground/40 border-t-primary-foreground" />
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 11) % 6) / 10,
        color: ["#ff8a65", "#7dd3fc", "#facc15", "#a78bfa", "#4ade80"][i % 5],
        rotate: (i * 47) % 360,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 h-2.5 w-2.5 rounded-sm"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
