import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Inbox, PlusCircle, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { readInvoices, type Invoice } from "@/lib/stellar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StellarInvoice" },
      { name: "description", content: "See every invoice you've sent, at a glance." },
    ],
  }),
  component: Dashboard,
});

type Filter = "all" | "pending" | "paid";

function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await readInvoices();
        setInvoices(data);
      } catch (err) {
        console.error("Failed to load invoices:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = invoices.filter((i) => {
    if (filter !== "all" && i.status !== filter) return false;
    if (query && !i.description.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalPending = invoices
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Your invoices 📬</h1>
          <p className="mt-1 text-muted-foreground">Every request you've sent, in one cozy place.</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
        >
          <PlusCircle className="h-5 w-5" /> New invoice
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard emoji="📋" label="Total invoices" value={invoices.length.toString()} tone="neutral" />
        <StatCard emoji="⏳" label="Pending" value={`${totalPending.toFixed(2)} XLM`} tone="warning" />
        <StatCard emoji="✅" label="Paid" value={`${totalPaid.toFixed(2)} XLM`} tone="success" />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full bg-secondary/70 p-1">
          {(["all", "pending", "paid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize transition ${
                filter === f
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search description…"
            className="w-40 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/70 sm:w-56"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-primary/40 border-t-primary" />
            <p className="mt-3 text-sm font-bold text-muted-foreground">Loading invoices from database…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasAny={invoices.length > 0} />
        ) : (
          filtered.map((inv) => <InvoiceCard key={inv.id} invoice={inv} />)
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  emoji,
  label,
  value,
  tone,
}: {
  emoji: string;
  label: string;
  value: string;
  tone: "neutral" | "warning" | "success";
}) {
  const bg =
    tone === "warning"
      ? "bg-[oklch(0.97_0.09_90)]"
      : tone === "success"
        ? "bg-[oklch(0.95_0.08_155)]"
        : "bg-card";
  return (
    <div className={`rounded-3xl ${bg} p-5 ring-1 ring-border`}>
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 text-sm font-bold text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const paid = invoice.status === "paid";
  return (
    <Link
      to="/pay/$id"
      params={{ id: invoice.id }}
      className="group rounded-3xl bg-card p-5 ring-1 ring-border transition hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            #{invoice.id}
          </div>
          <div className="mt-1 text-lg font-extrabold">{invoice.description}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {new Date(invoice.createdAt).toLocaleDateString()}
            {invoice.dueDate && ` · due ${new Date(invoice.dueDate).toLocaleDateString()}`}
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            paid
              ? "bg-[oklch(0.94_0.08_155)] text-[oklch(0.35_0.1_155)]"
              : "bg-[oklch(0.95_0.1_90)] text-[oklch(0.45_0.1_75)]"
          }`}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
          {paid ? "Paid" : "Pending"}
        </span>
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-3xl font-extrabold">{invoice.amount}</span>
          <span className="ml-1 text-sm font-bold text-muted-foreground">XLM</span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition group-hover:opacity-100">
          Open <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="col-span-full rounded-3xl bg-card p-10 text-center ring-1 ring-border">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-xl font-extrabold">
        {hasAny ? "Nothing matches that filter" : "No invoices yet"}
      </h3>
      <p className="mt-1 text-muted-foreground">
        {hasAny
          ? "Try a different tab or clear your search."
          : "Send your first invoice and get paid in XLM ✨"}
      </p>
      {!hasAny && (
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-extrabold text-primary-foreground transition hover:-translate-y-0.5"
        >
          <PlusCircle className="h-5 w-5" /> Create invoice
        </Link>
      )}
    </div>
  );
}