"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { useBudgets, useDeleteBudget, type Budget, type BudgetStatus } from "./api";

// Spasi tak terputus agar "Rp" tidak terpisah dari angkanya saat baris membungkus di layar sempit.
const nb = (text: string) => text.replace("Rp ", "Rp\u00a0");

const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : "Terjadi kesalahan. Coba lagi.");

// Status selalu berupa kata + ikon, tidak hanya warna.
const STATUS: Record<BudgetStatus, { label: string; icon: string; iconTone: string; bar: string }> = {
  ok: { label: "Aman", icon: "✓", iconTone: "text-income", bar: "bg-primary" },
  warning: { label: "Hampir habis", icon: "!", iconTone: "text-warning", bar: "bg-warning" },
  over: { label: "Melebihi", icon: "✕", iconTone: "text-expense", bar: "bg-expense" },
};

type Props = { month: string; onEdit: (budget: Budget) => void };

export function BudgetList({ month, onEdit }: Props) {
  const { data, isPending, error, refetch } = useBudgets(month);
  const remove = useDeleteBudget();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div role="status" aria-label="Memuat anggaran" className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 p-4 text-sm">
        <span className="text-destructive">{messageOf(error)}</span>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState title="Belum ada anggaran" description="Tetapkan batas pengeluaran bulanan per kategori, lalu pantau progresnya di sini." />;
  }

  const onDelete = async (b: Budget) => {
    if (!confirm(`Hapus anggaran "${b.category_name}"?`)) return;
    setActionError(null);
    try {
      await remove.mutateAsync(b.id);
    } catch (e) {
      setActionError(messageOf(e));
    }
  };

  return (
    <div className="space-y-3">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}
      <ul className="space-y-3">
        {data.map((b) => {
          const s = STATUS[b.status];
          const width = Math.min(b.percent, 100);

          return (
            <li key={b.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.category_name}</p>
                  <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">{`${nb(formatRupiah(b.spent))} dari ${nb(formatRupiah(b.amount))}`}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Ubah ${b.category_name}`} onClick={() => onEdit(b)}>
                    Ubah
                  </Button>
                  <Button variant="destructive" size="sm" aria-label={`Hapus ${b.category_name}`} disabled={remove.isPending} onClick={() => onDelete(b)}>
                    Hapus
                  </Button>
                </div>
              </div>

              <div
                role="meter"
                aria-label={b.category_name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={width}
                className="mt-3 h-2 rounded-full bg-muted"
              >
                <div className={`h-full rounded-r-full rounded-l-sm ${s.bar}`} style={{ width: `${width}%` }} />
              </div>

              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span data-status={b.status} className="inline-flex items-center gap-1.5 font-medium">
                  <span aria-hidden="true" className={`font-bold ${s.iconTone}`}>
                    {s.icon}
                  </span>
                  {s.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <span>{b.percent}%</span>
                  <span className="mx-1.5" aria-hidden="true">
                    ·
                  </span>
                  <span>{b.remaining >= 0 ? `Sisa ${formatRupiah(b.remaining)}` : `Lebih ${formatRupiah(-b.remaining)}`}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
