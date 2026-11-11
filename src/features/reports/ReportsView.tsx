import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryTab } from "./CategoryTab";
import { TrendTab } from "./TrendTab";
import { WalletTab } from "./WalletTab";

export const REPORT_TABS = [
  { id: "trend", label: "Tren" },
  { id: "category", label: "Kategori" },
  { id: "wallets", label: "Dompet" },
] as const;

type TabId = (typeof REPORT_TABS)[number]["id"];

const isTab = (value: string | undefined): value is TabId => REPORT_TABS.some((t) => t.id === value);

export function ReportsView({ tab }: { tab: string | undefined }) {
  const active: TabId = isTab(tab) ? tab : "trend";

  return (
    <>
      <PageHeader title="Laporan" />

      <nav role="tablist" aria-label="Jenis laporan" className="mb-6 flex gap-1 border-b border-border">
        {REPORT_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/reports?tab=${t.id}`}
            role="tab"
            aria-selected={active === t.id}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${active === t.id ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {active === "trend" ? <TrendTab /> : active === "category" ? <CategoryTab /> : <WalletTab />}
    </>
  );
}
