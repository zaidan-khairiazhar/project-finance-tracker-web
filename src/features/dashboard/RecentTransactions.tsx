import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatRupiah } from "@/lib/format";
import { useTransactions, type Transaction } from "@/features/transactions/api";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const SIGN: Record<Transaction["type"], string> = { income: "+", transfer_in: "+", expense: "-", transfer_out: "-" };
const TONE: Record<Transaction["type"], string> = {
  income: "text-income",
  expense: "text-expense",
  transfer_in: "text-muted-foreground",
  transfer_out: "text-muted-foreground",
};
const LABEL: Record<Transaction["type"], string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer_in: "Transfer masuk",
  transfer_out: "Transfer keluar",
};

export function RecentTransactions() {
  const { data, isPending, error } = useTransactions({ per_page: 5 });

  if (isPending) {
    return (
      <div role="status" aria-label="Memuat transaksi terbaru" className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }
  if (error) {
    return <p role="alert" className="text-sm text-destructive">{error instanceof ApiError ? error.message : "Gagal memuat transaksi."}</p>;
  }

  const items = data.pages[0]?.data.slice(0, 5) ?? [];
  if (items.length === 0) {
    return <EmptyState title="Belum ada transaksi" description="Catat transaksi pertamamu di halaman Transaksi." action={<Link href="/transactions" className="text-sm font-medium underline">Ke Transaksi</Link>} />;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{t.note || LABEL[t.type]}</p>
            <p className="text-xs text-muted-foreground">{formatDate(t.occurred_at)}</p>
          </div>
          <span className={`shrink-0 text-sm font-medium tabular-nums ${TONE[t.type]}`}>
            {SIGN[t.type]}{formatRupiah(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
