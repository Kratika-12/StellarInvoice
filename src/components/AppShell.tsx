import { Link, useRouterState } from "@tanstack/react-router";
import { Wallet, Sparkles, LogOut, LayoutGrid, PlusCircle } from "lucide-react";
import { useWallet, truncateAddr } from "@/lib/stellar";
import type { ReactNode } from "react";

function WalletBadge() {
  const { address, balance, connecting, funding, connect, disconnect, fundWallet } = useWallet();

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] active:translate-y-0 disabled:opacity-70"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {balance === 0 ? (
        <button
          onClick={fundWallet}
          disabled={funding}
          className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.97_0.05_45)] px-3 py-1.5 text-sm font-extrabold text-[oklch(0.45_0.15_45)] hover:bg-[oklch(0.94_0.07_45)] transition hover:-translate-y-0.5 disabled:opacity-70 shadow-sm"
        >
          {funding ? "Funding…" : "🎁 Fund Wallet"}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.94_0.06_155)] px-3 py-1.5 text-sm font-bold text-[oklch(0.35_0.09_155)]">
          💰 {balance.toFixed(1)} XLM
        </span>
      )}
      <div className="group relative">
        <button className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-foreground ring-1 ring-border transition hover:-translate-y-0.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[oklch(0.72_0.18_155)]" />
          {truncateAddr(address)}
        </button>
        <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-40 rounded-2xl bg-white p-2 opacity-0 shadow-[var(--shadow-lift)] ring-1 ring-border transition group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            onClick={fundWallet}
            disabled={funding}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-75"
          >
            🎁 {funding ? "Funding…" : "Get XLM Faucet"}
          </button>
          <button
            onClick={disconnect}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-white hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Stellar<span className="text-primary">Invoice</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full bg-secondary/70 p-1 sm:flex">
            <NavLink to="/" icon={<PlusCircle className="h-4 w-4" />}>Create</NavLink>
            <NavLink to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />}>Dashboard</NavLink>
          </nav>
          <WalletBadge />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6">{children}</main>
      <footer className="pb-8 text-center text-sm text-muted-foreground">
        Built with 🚀 on Stellar testnet
      </footer>
    </div>
  );
}