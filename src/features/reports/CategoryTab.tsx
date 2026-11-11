"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRupiah } from "@/lib/format";
import { useCategoryComparison, type CategoryComparison, type CategoryComparisonType } from "./api";
import { ReportError, ReportLoading } from "./ReportStatus";

const TYPES: { id: CategoryComparisonType; label: string }[] = [
  { id: "expense", label: "Pengeluaran" },
  { id: "income", label: "Pemasukan" },
];
const WORDS: Record<CategoryComparisonType, string> = { expense: "pengeluaran", income: "pemasukan" };
const MONTH_COUNTS = Array.from({ length: 10 }, (_, i) => i + 3);
const MAX_BARS = 8;

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

function Comparison({ data, type }: { data: CategoryComparison; type: CategoryComparisonType }) {
  const max = Math.max(...data.rows.map((r) => r.total), 0);
  const fill = type === "expense" ? "bg-expense" : "bg-income";

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {data.rows.slice(0, MAX_BARS).map((row) => (
          <li key={row.category_id ?? "none"}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">{row.name}</span>
              <span className="shrink-0 font-medium tabular-nums">{formatRupiah(row.total)}</span>
            </div>
            <div role="meter" aria-label={row.name} aria-valuemin={0} aria-valuemax={max} aria-valuenow={row.total} className="mt-1.5 h-2 rounded-full bg-muted">
              <div className={`h-full rounded-r-full rounded-l-sm ${fill}`} style={{ width: `${(row.total / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Total {WORDS[type]} kategori per bulan</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 pr-3 text-left font-medium">Kategori</th>
              {data.months.map((m) => (
                <th key={m} scope="col" className="whitespace-nowrap px-2 py-2 text-right font-medium">{monthLabel(m)}</th>
              ))}
              <th scope="col" className="whitespace-nowrap py-2 pl-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.category_id ?? "none"} className="border-b border-border/60 last:border-0">
                <th scope="row" className="whitespace-nowrap py-2 pr-3 text-left font-normal">{row.name}</th>
                {row.totals.map((t, i) => (
                  <td key={data.months[i]} className="whitespace-nowrap px-2 py-2 text-right tabular-nums">{formatRupiah(t)}</td>
                ))}
                <td className="whitespace-nowrap py-2 pl-2 text-right font-medium tabular-nums">{formatRupiah(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CategoryTab() {
  const [type, setType] = useState<CategoryComparisonType>("expense");
  const [months, setMonths] = useState(6);
  const query = useCategoryComparison(months, type);
  const hasData = query.data?.rows.some((r) => r.total > 0);

  return (
    <section aria-labelledby="category-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="category-title" className="font-medium">Kategori antar bulan</h2>
        <div className="flex items-center gap-3">
          <div role="radiogroup" aria-label="Jenis" className="inline-flex rounded-md border border-border p-0.5 text-sm">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={type === t.id}
                onClick={() => setType(t.id)}
                className={`rounded px-3 py-1 ${type === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">Jumlah bulan</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {MONTH_COUNTS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {query.isPending ? (
        <ReportLoading label="Memuat kategori" />
      ) : query.error ? (
        <ReportError error={query.error} onRetry={() => query.refetch()} />
      ) : !hasData ? (
        <EmptyState title={`Belum ada ${WORDS[type]} pada periode ini`} />
      ) : (
        <Comparison data={query.data} type={type} />
      )}
    </section>
  );
}
