"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { useMonthlyTrend, type TrendMonths } from "./api";
import { ReportError, ReportLoading } from "./ReportStatus";
import { TrendChart } from "./TrendChart";

const OPTIONS: TrendMonths[] = [6, 12];

export function TrendTab() {
  const [months, setMonths] = useState<TrendMonths>(6);
  const trend = useMonthlyTrend(months);
  const hasData = trend.data?.some((p) => p.income > 0 || p.expense > 0);

  return (
    <section aria-labelledby="trend-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="trend-title" className="font-medium">Pemasukan vs pengeluaran</h2>
        <div role="radiogroup" aria-label="Rentang" className="inline-flex rounded-md border border-border p-0.5 text-sm">
          {OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={months === m}
              onClick={() => setMonths(m)}
              className={`rounded px-3 py-1 ${months === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {m} bulan
            </button>
          ))}
        </div>
      </div>

      {trend.isPending ? (
        <ReportLoading label="Memuat tren" />
      ) : trend.error ? (
        <ReportError error={trend.error} onRetry={() => trend.refetch()} />
      ) : !hasData ? (
        <EmptyState title="Belum ada transaksi pada periode ini" />
      ) : (
        <TrendChart data={trend.data} />
      )}
    </section>
  );
}
