import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Wallet, Sparkles, LogOut, LayoutGrid, PlusCircle } from "lucide-react";
import { useWallet, truncateAddr } from "@/lib/stellar";
import type { ReactNode } from "react";

function WalletBadge() {
  const navigate = useNavigate();
  const {
    address,
    balance,
    connecting,
    funding,
    walletName,
    error,
    connect,
    disconnect,
    fundWallet,
  } = useWallet();

  async function handleConnect() {
    try {
      await connect();
      await navigate({ to: "/dashboard", replace: true });
    } catch {
      // The wallet provider exposes the actionable error beside the button.
    }
  }

  function handleDisconnect() {
    disconnect();
    void navigate({ to: "/", replace: true });
  }

  if (!address) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleConnect}
          disabled={connecting}
          aria-busy={connecting}
          className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 disabled:opacity-70"
        >
          <Wallet className="h-4 w-4" aria-hidden="true" />
          {connecting ? "Opening wallets…" : "Choose Wallet"}
        </button>
        {error && <span className="max-w-60 text-right text-xs text-destructive">{error}</span>}
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
      {balance === 0 ? (
        <button
          onClick={fundWallet}
          disabled={funding}
          className="hidden min-h-10 items-center gap-1.5 rounded-full bg-[oklch(0.97_0.05_45)] px-3 py-1.5 text-sm font-extrabold text-[oklch(0.45_0.15_45)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[oklch(0.94_0.07_45)] disabled:opacity-70 sm:inline-flex"
        >
          {funding ? "Funding…" : "🎁 Fund Wallet"}
        </button>
      ) : (
        <span className="hidden min-h-10 items-center gap-1.5 rounded-full bg-[oklch(0.94_0.06_155)] px-3 py-1.5 text-sm font-bold text-[oklch(0.35_0.09_155)] sm:inline-flex">
          💰 {balance.toFixed(1)} XLM
        </span>
      )}
      <div className="group relative">
        <button className="inline-flex min-h-10 max-w-36 items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-bold text-foreground ring-1 ring-border transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-none">
          <span className="inline-block h-2 w-2 rounded-full bg-success-foreground" />
          {walletName ? `${walletName} · ` : ""}
          {truncateAddr(address)}
        </button>
        <div className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-44 rounded-2xl bg-card p-2 opacity-0 shadow-[var(--shadow-lift)] ring-1 ring-border transition group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            onClick={fundWallet}
            disabled={funding}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-75"
          >
            🎁 {funding ? "Funding…" : "Get XLM Faucet"}
          </button>
          <button
            onClick={handleDisconnect}
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
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
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
    <div className="min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Link
            to="/"
            aria-label="StellarInvoice home"
            className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)] sm:rounded-2xl">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="hidden text-xl font-extrabold tracking-tight min-[430px]:inline">
              Stellar<span className="text-primary">Invoice</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full bg-secondary/70 p-1 sm:flex">
            <NavLink to="/create" icon={<PlusCircle className="h-4 w-4" />}>
              Create
            </NavLink>
            <NavLink to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />}>
              Dashboard
            </NavLink>
          </nav>
          <WalletBadge />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-2 sm:px-6 sm:pb-24 sm:pt-4">{children}</main>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-center gap-1 rounded-full bg-card/95 p-1.5 shadow-[var(--shadow-lift)] ring-1 ring-border backdrop-blur-md sm:hidden"
      >
        <NavLink to="/create" icon={<PlusCircle className="h-4 w-4" aria-hidden="true" />}>
          Create
        </NavLink>
        <NavLink to="/dashboard" icon={<LayoutGrid className="h-4 w-4" aria-hidden="true" />}>
          Dashboard
        </NavLink>
      </nav>
      <footer className="pb-24 text-center text-xs text-muted-foreground sm:pb-8 sm:text-sm">
        Built with 🚀 on Stellar testnet
      </footer>
    </div>
  );
}
