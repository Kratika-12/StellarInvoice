import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileText, QrCode, Sparkles, Wallet, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useWallet } from "@/lib/stellar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StellarInvoice — Friendly invoicing on Stellar" },
      {
        name: "description",
        content: "Create shareable invoices and receive XLM payments on Stellar testnet.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { address } = useWallet();

  return (
    <AppShell>
      <div className="relative overflow-x-clip">
        <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-32 h-72 w-72 rounded-full bg-secondary blur-3xl" />

        <section className="relative grid items-center gap-12 py-10 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-bold text-primary ring-1 ring-border">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />
              Stellar Testnet · No sign-up
            </span>
            <h1 className="mt-5 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Friendly invoices.
              <span className="block text-primary">Fast XLM payments.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Create a payment request, share its link or QR code, and receive payment directly
              through Stellar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {address ? (
                <Link
                  to="/create"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-extrabold text-primary-foreground shadow-[var(--shadow-soft)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
                >
                  Create an invoice <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              ) : (
                <span className="inline-flex min-h-12 items-center gap-2 rounded-full bg-secondary px-5 py-3 font-bold text-secondary-foreground">
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                  Connect your wallet to begin
                </span>
              )}
              <Link
                to="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-card px-6 py-3 font-extrabold text-foreground ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
              >
                View dashboard
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted-foreground">
              {["Soroban powered", "Shareable links", "Real-time status"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-success-foreground" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-card p-6 shadow-[var(--shadow-lift)] ring-1 ring-border sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-extrabold">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                How it works
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                Three quick steps
              </span>
            </div>
            <div className="mt-6 space-y-4">
              <Step
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                number="01"
                title="Create your invoice"
                body="Add the XLM amount, description, and optional due date."
              />
              <Step
                icon={<QrCode className="h-5 w-5" aria-hidden="true" />}
                number="02"
                title="Share the payment page"
                body="Copy the unique link or let your payer scan its QR code."
              />
              <Step
                icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
                number="03"
                title="Receive payment"
                body="The payer signs in their wallet and your dashboard updates."
              />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Step({
  icon,
  number,
  title,
  body,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-secondary/60 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-card text-primary ring-1 ring-border">
        {icon}
      </span>
      <div>
        <div className="text-xs font-extrabold text-primary">{number}</div>
        <h2 className="font-extrabold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
