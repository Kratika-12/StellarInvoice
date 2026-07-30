import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  PartyPopper,
  Wallet,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useWallet, createInvoice, type Invoice } from "@/lib/stellar";
import { classifyWalletError, validateAmount } from "@/lib/invoice";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { address, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!address) {
      try {
        await connect();
      } catch (error) {
        setFormError(classifyWalletError(error));
      }
      return;
    }
    const amountError = validateAmount(amount);
    if (amountError) {
      setFormError(amountError);
      document.getElementById("amount")?.focus();
      return;
    }
    if (!description.trim()) {
      setFormError("Add a short description for the payer.");
      document.getElementById("description")?.focus();
      return;
    }
    setCreating(true);
    try {
      const inv = await createInvoice({ amount, description, dueDate, from: address });
      setInvoice(inv);
    } catch (error) {
      setFormError(classifyWalletError(error));
    } finally {
      setCreating(false);
    }
  }

  const shareUrl =
    invoice && typeof window !== "undefined" ? `${window.location.origin}/pay/${invoice.id}` : "";

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function reset() {
    setInvoice(null);
    setAmount("");
    setDescription("");
    setDueDate("");
  }

  return (
    <AppShell>
      <div className="relative overflow-x-clip">
        {/* playful blobs */}
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[oklch(0.9_0.09_25)] blur-3xl opacity-40" />
        <div className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-[oklch(0.9_0.09_210)] blur-3xl opacity-40" />

        <section className="relative grid gap-10 pt-6 md:grid-cols-2 md:pt-10">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary ring-1 ring-border">
              <Zap className="h-3.5 w-3.5" /> Stellar Testnet · No sign-up
            </span>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Get paid in XLM,{" "}
              <span className="relative inline-block">
                <span className="relative z-10">without the fuss</span>
                <span className="absolute -bottom-1 left-0 z-0 h-3 w-full rounded-full bg-primary/30" />
              </span>{" "}
              ✨
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Whip up a friendly invoice, share the link, and let anyone pay you with a Stellar
              wallet. It really is that simple. 🪄
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[oklch(0.6_0.15_155)]" /> No fees
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[oklch(0.6_0.15_155)]" /> QR + link
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-[oklch(0.6_0.15_155)]" /> Instant
              </span>
            </div>
          </div>

          <div className="animate-float-slow relative">
            <div className="absolute -top-3 -right-2 rotate-6 rounded-2xl bg-white px-3 py-1.5 text-xs font-bold shadow-[var(--shadow-soft)]">
              💸 new invoice
            </div>
            {invoice ? (
              <SuccessCard
                invoice={invoice}
                shareUrl={shareUrl}
                copied={copied}
                onCopy={copyLink}
                onReset={reset}
              />
            ) : (
              <form
                onSubmit={onSubmit}
                aria-busy={creating}
                className="rounded-[2rem] bg-card p-6 shadow-[var(--shadow-lift)] ring-1 ring-border sm:p-8"
              >
                <div className="mb-5 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" /> Create an invoice
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm font-semibold text-destructive"
                  >
                    {formError}
                  </div>
                )}

                <Field label="Amount (XLM)" hint="How much are you owed?" htmlFor="amount">
                  <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 ring-1 ring-transparent focus-within:bg-white focus-within:ring-primary/60">
                    <span className="text-xl">🪙</span>
                    <input
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      aria-invalid={formError?.includes("amount") ? "true" : undefined}
                      required
                      placeholder="42.00"
                      className="w-full bg-transparent text-2xl font-extrabold outline-none placeholder:text-muted-foreground/60"
                    />
                    <span className="text-sm font-bold text-muted-foreground">XLM</span>
                  </div>
                </Field>

                <Field
                  label="What's it for?"
                  hint="A short note so payers know why"
                  htmlFor="description"
                >
                  <input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Design work for July 🎨"
                    className="w-full rounded-2xl bg-secondary/60 px-4 py-3 font-semibold outline-none ring-1 ring-transparent placeholder:text-muted-foreground/60 focus:bg-white focus:ring-primary/60"
                  />
                </Field>

                <Field label="Due date (optional)" htmlFor="due-date">
                  <input
                    id="due-date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    type="date"
                    className="w-full rounded-2xl bg-secondary/60 px-4 py-3 font-semibold outline-none ring-1 ring-transparent placeholder:text-muted-foreground/60 focus:bg-white focus:ring-primary/60"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={creating || connecting}
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-lg font-extrabold text-primary-foreground shadow-[var(--shadow-soft)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {creating ? (
                    <>
                      <Spinner /> Cooking it up…
                    </>
                  ) : !address ? (
                    <>
                      <Wallet className="h-5 w-5" /> Connect wallet to start
                    </>
                  ) : (
                    <>
                      Generate Invoice <Send className="h-5 w-5" />
                    </>
                  )}
                </button>
                {!address && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    We'll connect your Stellar wallet first — takes a second ⚡
                  </p>
                )}
              </form>
            )}
          </div>
        </section>

        <section className="mt-20 grid gap-4 sm:grid-cols-3">
          {[
            {
              emoji: "📝",
              title: "Describe it",
              body: "Amount + a friendly note. That's the whole form.",
            },
            {
              emoji: "🔗",
              title: "Share the link",
              body: "Send by DM, email, or scan the QR — payers just tap.",
            },
            {
              emoji: "🎉",
              title: "Get paid",
              body: "Payment lands on Stellar testnet in seconds.",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-3xl bg-card p-6 ring-1 ring-border transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="text-3xl">{s.emoji}</div>
              <h3 className="mt-3 text-lg font-extrabold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-14 flex items-center justify-between rounded-3xl bg-foreground p-6 text-background sm:p-8">
          <div>
            <h3 className="text-2xl font-extrabold">See all your invoices</h3>
            <p className="mt-1 text-sm text-background/70">
              Pending, paid, and everything in between.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground transition hover:-translate-y-0.5"
          >
            Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-sm font-bold text-foreground">
          {label}
        </label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-primary-foreground/40 border-t-primary-foreground" />
  );
}

function SuccessCard({
  invoice,
  shareUrl,
  copied,
  onCopy,
  onReset,
}: {
  invoice: Invoice;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    shareUrl,
  )}`;
  return (
    <div className="animate-pop-in rounded-[2rem] bg-card p-6 shadow-[var(--shadow-lift)] ring-1 ring-border sm:p-8">
      <div className="flex items-center gap-2 text-sm font-bold text-[oklch(0.5_0.15_155)]">
        <PartyPopper className="h-4 w-4" /> Invoice created!
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-5xl font-extrabold">{invoice.amount}</span>
        <span className="text-lg font-bold text-muted-foreground">XLM</span>
      </div>
      <p className="mt-1 text-foreground/80">{invoice.description}</p>

      <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-secondary/60 p-4">
        <img
          src={qrUrl}
          alt="Invoice QR code"
          className="rounded-2xl bg-white p-2 ring-1 ring-border"
          width={220}
          height={220}
        />
        <div className="flex w-full items-center gap-2">
          <div className="flex-1 overflow-hidden rounded-full bg-white px-4 py-2 text-sm text-muted-foreground ring-1 ring-border">
            <span className="block truncate font-mono">{shareUrl}</span>
          </div>
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-bold text-background transition hover:-translate-y-0.5"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          to="/pay/$id"
          params={{ id: invoice.id }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-extrabold text-primary-foreground transition hover:-translate-y-0.5"
        >
          <QrCode className="h-4 w-4" /> Preview pay page
        </Link>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-2xl bg-secondary px-4 py-3 font-bold text-secondary-foreground transition hover:-translate-y-0.5"
        >
          New one
        </button>
      </div>
    </div>
  );
}
