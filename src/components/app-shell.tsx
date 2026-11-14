"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

const icons: Record<string, string> = {
  dashboard: "M3 12 12 3l9 9M5 10v10h5v-6h4v6h5V10",
  transactions: "M4 6h16M4 12h16M4 18h10",
  wallets: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0V6a2 2 0 0 1 2-2h11M16 14h2",
  categories: "M3 12V4h8l10 10-8 8L3 12Zm5-5h.01",
  budgets: "M21 12A9 9 0 1 1 12 3v9h9Z",
  reports: "M5 21V10M12 21V4M19 21v-7",
  recurring: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transaksi", icon: "transactions" },
  { href: "/wallets", label: "Dompet", icon: "wallets" },
  { href: "/categories", label: "Kategori", icon: "categories" },
  { href: "/budgets", label: "Anggaran", icon: "budgets" },
  { href: "/reports", label: "Laporan", icon: "reports" },
  { href: "/recurring", label: "Berulang", icon: "recurring" },
];

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">Rp</div>
      <span className="font-semibold tracking-tight">Finance Tracker</span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen flex-1">
      {/* Desktop: sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card p-4 md:flex">
        <div className="px-2 py-3">
          <Brand />
        </div>
        <nav aria-label="Navigasi utama" className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground"
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        {/* Mobile: bilah atas */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
          <Brand />
          <LogoutButton />
        </div>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-10 md:pb-10">{children}</main>
      </div>

      {/* Mobile: navigasi bawah */}
      <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-border bg-card md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground aria-[current=page]:text-primary"
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
