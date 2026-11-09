"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useCategoryBreakdown, useSummary, type BreakdownType } from "./api";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { MonthPicker } from "./MonthPicker";
import { RecentTransactions } from "./RecentTransactions";
import { SummaryCards } from "./SummaryCards";

const messageOf = (error: unknown) => (error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi.");

function Loading({ label, className }: { label: string; className: string }) {
  return (
    <div role="status" aria-label={label}>
      <Skeleton className={className} />
    </div>
  );
}

function ErrorBox({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
      <span>{messageOf(error)}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>Coba lagi</Button>
    </div>
  );
}

export function DashboardView({ initialMonth, currentMonth }: { initialMonth: string; currentMonth: string }) {
  const [month, setMonth] = useState(initialMonth);
  const [type, setType] = useState<BreakdownType>("expense");
  const summary = useSummary(month);
  const breakdown = useCategoryBreakdown(month, type);

  return (
    <>
      <PageHeader title="Dashboard" action={<MonthPicker value={month} max={currentMonth} onChange={setMonth} />} />

      <div className="space-y-8">
        {summary.isPending ? (
          <Loading label="Memuat ringkasan" className="h-24" />
        ) : summary.error ? (
          <ErrorBox error={summary.error} onRetry={() => summary.refetch()} />
        ) : (
          <SummaryCards data={summary.data} />
        )}

        <section aria-labelledby="by-category">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="by-category" className="font-medium">Per kategori</h2>
            <div role="radiogroup" aria-label="Jenis" className="inline-flex rounded-md border border-border p-0.5 text-sm">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={type === t}
                  onClick={() => setType(t)}
                  className={`rounded px-3 py-1 ${type === t ? "bg-muted font-medium" : "text-muted-foreground"}`}
                >
                  {t === "expense" ? "Pengeluaran" : "Pemasukan"}
                </button>
              ))}
            </div>
          </div>
          {breakdown.isPending ? (
            <Loading label="Memuat kategori" className="h-40" />
          ) : breakdown.error ? (
            <ErrorBox error={breakdown.error} onRetry={() => breakdown.refetch()} />
          ) : (
            <CategoryBreakdown data={breakdown.data} type={type} />
          )}
        </section>

        <section aria-labelledby="recent">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent" className="font-medium">Transaksi terbaru</h2>
            <Link href="/transactions" className="text-sm text-muted-foreground underline">Lihat semua</Link>
          </div>
          <RecentTransactions />
        </section>
      </div>
    </>
  );
}
