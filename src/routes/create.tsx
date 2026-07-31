import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Copy,
  FileText,
  QrCode,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { classifyWalletError, validateAmount } from "@/lib/invoice";
import { createInvoice, truncateAddr, useWallet, type Invoice } from "@/lib/stellar";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create invoice — StellarInvoice" },
      {
        name: "description",
        content: "Create a shareable Stellar invoice and receive XLM on testnet.",
      },
    ],
  }),
  component: CreateInvoicePage,
});

function CreateInvoicePage() {
  const navigate = useNavigate();
  const { address, connecting } = useWallet();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!connecting && !address) {
      void navigate({ to: "/", replace: true });
    }
  }, [address, connecting, navigate]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!address) return;

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
      const createdInvoice = await createInvoice({
        amount,
        description,
        dueDate,
        from: address,
      });
      setInvoice(createdInvoice);
    } catch (error) {
      setFormError(classifyWalletError(error));
    } finally {
      setCreating(false);
    }
  }

  const shareUrl =
    invoice && typeof window !== "undefined" ? `${window.location.origin}/pay/${invoice.id}` : "";

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function resetForm() {
    setInvoice(null);
    setAmount("");
    setDescription("");
    setDueDate("");
    setFormError(null);
  }

  if (!address) return null;

  return (
    <AppShell>
      <div className="relative mx-auto max-w-5xl py-3 sm:py-7">
        <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-secondary blur-3xl" />

        <div className="relative">
          <Link
            to="/dashboard"
            className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-colors hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>

          <header className="mt-3 max-w-2xl sm:mt-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary sm:text-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              New payment request
            </span>
            <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Create an invoice
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Add the payment details once. We’ll create the on-chain invoice and a page you can
              share anywhere.
            </p>
          </header>

          {invoice ? (
            <SuccessPanel
              invoice={invoice}
              shareUrl={shareUrl}
              copied={copied}
              onCopy={copyLink}
              onReset={resetForm}
            />
          ) : (
            <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <form
                onSubmit={onSubmit}
                aria-busy={creating}
                className="rounded-3xl bg-card p-4 shadow-[var(--shadow-lift)] ring-1 ring-border sm:p-6"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold">Invoice details</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Required fields are marked with an asterisk.
                    </p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ReceiptText className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>

                {formError && (
                  <div
                    id="form-error"
                    role="alert"
                    className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive sm:text-sm"
                  >
                    {formError}
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <Field
                    label="Amount"
                    required
                    hint="The exact amount your payer will send."
                    htmlFor="amount"
                  >
                    <div className="flex min-h-12 items-center rounded-xl bg-secondary/60 px-3 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
                      <input
                        id="amount"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={formError?.toLowerCase().includes("amount") || undefined}
                        aria-describedby={formError ? "form-error amount-hint" : "amount-hint"}
                        required
                        placeholder="0.00"
                        className="min-w-0 flex-1 bg-transparent text-2xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/50"
                      />
                      <span className="rounded-full bg-card px-2.5 py-1 text-xs font-extrabold text-primary ring-1 ring-border">
                        XLM
                      </span>
                    </div>
                  </Field>

                  <Field
                    label="Description"
                    required
                    hint="Help the payer recognize this request."
                    htmlFor="description"
                  >
                    <div className="flex items-start gap-2.5 rounded-xl bg-secondary/60 px-3 py-2.5 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
                      <FileText
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <textarea
                        id="description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                        maxLength={160}
                        rows={3}
                        aria-invalid={formError?.toLowerCase().includes("description") || undefined}
                        aria-describedby={
                          formError ? "form-error description-hint" : "description-hint"
                        }
                        placeholder="Brand identity design for August"
                        className="min-h-16 w-full resize-none bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/60"
                      />
                    </div>
                    <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">
                      {description.length}/160
                    </p>
                  </Field>

                  <Field
                    label="Due date"
                    hint="Optional — useful for keeping everyone aligned."
                    htmlFor="due-date"
                  >
                    <div className="flex min-h-11 items-center gap-2.5 rounded-xl bg-secondary/60 px-3 ring-1 ring-border focus-within:ring-2 focus-within:ring-primary">
                      <CalendarDays
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <input
                        id="due-date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        type="date"
                        className="min-h-11 w-full bg-transparent text-sm font-semibold outline-none"
                      />
                    </div>
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  aria-busy={creating}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-[var(--shadow-soft)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                >
                  {creating ? (
                    <>
                      <Spinner /> Creating on Stellar…
                    </>
                  ) : (
                    <>
                      Create & share invoice <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-xs font-semibold text-muted-foreground">
                  Your wallet will ask you to approve the contract transaction.
                </p>
              </form>

              <aside className="space-y-4 lg:sticky lg:top-28">
                <div className="rounded-2xl bg-foreground p-4 text-background">
                  <div className="flex items-center gap-2 text-sm font-extrabold">
                    <Wallet className="h-4 w-4" aria-hidden="true" />
                    Creator wallet
                  </div>
                  <p className="mt-3 break-all font-mono text-sm text-background/80">
                    {truncateAddr(address)}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-background/70">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Connected to testnet
                  </div>
                </div>

                <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
                  <h2 className="text-sm font-extrabold">What happens next?</h2>
                  <ol className="mt-3 space-y-3">
                    <InfoStep number="1" text="Approve the invoice in your wallet." />
                    <InfoStep number="2" text="Copy the payment link or QR code." />
                    <InfoStep number="3" text="Track payment from your dashboard." />
                  </ol>
                </div>

                <div className="flex gap-3 rounded-2xl bg-primary/10 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p>
                    <strong className="font-extrabold">On-chain and verifiable.</strong> Invoice
                    status is stored by the Soroban contract.
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  hint,
  required = false,
  htmlFor,
  children,
}: {
  label: string;
  hint: string;
  required?: boolean;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-xs font-extrabold text-foreground sm:text-sm">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <p id={`${htmlFor}-hint`} className="mb-2 mt-1 text-xs font-semibold text-muted-foreground">
        {hint}
      </p>
      {children}
    </div>
  );
}

function InfoStep({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex gap-3 text-sm">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-extrabold text-primary">
        {number}
      </span>
      <span className="pt-0.5 font-semibold text-muted-foreground">{text}</span>
    </li>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 motion-safe:animate-spin rounded-full border-[3px] border-primary-foreground/40 border-t-primary-foreground"
    />
  );
}

function SuccessPanel({
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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    shareUrl,
  )}`;

  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] bg-card shadow-[var(--shadow-lift)] ring-1 ring-border">
      <div className="bg-primary/10 p-6 sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <CircleCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-3xl font-extrabold">Invoice ready to share</h2>
        <p className="mt-2 text-muted-foreground">
          Your invoice is on-chain. Send this payment page to your client.
        </p>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          <p className="text-sm font-bold text-muted-foreground">Amount requested</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight">{invoice.amount}</span>
            <span className="text-lg font-extrabold text-primary">XLM</span>
          </div>
          <p className="mt-3 font-semibold text-foreground">{invoice.description}</p>

          <div className="mt-6">
            <label htmlFor="share-link" className="text-sm font-extrabold">
              Payment link
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="share-link"
                readOnly
                value={shareUrl}
                className="min-h-12 min-w-0 flex-1 rounded-2xl bg-secondary/60 px-4 font-mono text-sm outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-foreground px-5 font-extrabold text-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" /> Copy link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/pay/$id"
              params={{ id: invoice.id }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-extrabold text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
            >
              <Send className="h-4 w-4" aria-hidden="true" /> Preview payment page
            </Link>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-secondary px-5 font-extrabold text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-colors hover:bg-secondary/80"
            >
              Create another
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-60">
          <div className="rounded-3xl bg-secondary/60 p-4 text-center ring-1 ring-border">
            <img
              src={qrUrl}
              alt="QR code for this invoice payment page"
              width={240}
              height={240}
              className="aspect-square w-full rounded-2xl bg-card p-2"
            />
            <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Scan to open invoice
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
