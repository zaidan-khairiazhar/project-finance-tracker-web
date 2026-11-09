import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah } from "@/lib/format";
import type { BreakdownType, CategoryTotal } from "./api";

const MAX_ROWS = 8;
const WORDS: Record<BreakdownType, string> = { expense: "pengeluaran", income: "pemasukan" };

type Row = { key: string; name: string; total: number };

function toRows(data: CategoryTotal[]): Row[] {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const head: Row[] = sorted.slice(0, MAX_ROWS).map((c) => ({ key: c.category_id ?? "none", name: c.name, total: c.total }));
  const tail = sorted.slice(MAX_ROWS);
  if (tail.length > 0) {
    head.push({ key: "other", name: `Lainnya (${tail.length} kategori)`, total: tail.reduce((sum, c) => sum + c.total, 0) });
  }
  return head;
}

const share = (total: number, sum: number) => {
  const pct = (total / sum) * 100;
  return pct < 1 ? "<1%" : `${Math.round(pct)}%`;
};

/** Peringkat kategori sebagai batang horizontal: nama dan angka selalu terbaca, tanpa bergantung pada warna. */
export function CategoryBreakdown({ data, type }: { data: CategoryTotal[]; type: BreakdownType }) {
  const rows = toRows(data);
  const sum = rows.reduce((s, r) => s + r.total, 0);
  const max = Math.max(...rows.map((r) => r.total), 0);

  if (rows.length === 0 || sum === 0) {
    return <EmptyState title={`Belum ada ${WORDS[type]} bulan ini`} />;
  }

  const fill = type === "expense" ? "bg-expense" : "bg-income";

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{row.name}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{formatRupiah(row.total)}</span>
              <span className="ml-2 inline-block w-9 text-right text-muted-foreground">{share(row.total, sum)}</span>
            </span>
          </div>
          <div
            role="meter"
            aria-label={row.name}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={row.total}
            className="mt-1.5 h-2 rounded-full bg-muted"
          >
            <div className={`h-full rounded-r-full rounded-l-sm ${fill}`} style={{ width: `${(row.total / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
