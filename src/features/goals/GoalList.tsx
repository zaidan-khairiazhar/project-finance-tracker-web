"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportError, ReportLoading } from "@/features/reports/ReportStatus";
import { ApiError } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { useDeleteGoal, useGoals, type Goal, type GoalStatus, type GoalWalletStatus } from "./api";

// Spasi tak terputus agar "Rp" tidak terpisah dari angkanya saat baris membungkus di layar sempit.
const nb = (text: string) => text.replace("Rp ", "Rp ");

const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : "Terjadi kesalahan. Coba lagi.");

// Status selalu berupa kata + ikon, tidak hanya warna.
const STATUS: Record<GoalStatus, { label: string; icon: string; iconTone: string; bar: string }> = {
  in_progress: { label: "Berjalan", icon: "●", iconTone: "text-primary", bar: "bg-primary" },
  reached: { label: "Tercapai", icon: "✓", iconTone: "text-income", bar: "bg-income" },
  overdue: { label: "Lewat tenggat", icon: "!", iconTone: "text-warning", bar: "bg-warning" },
};

const WALLET_WARNING: Record<Exclude<GoalWalletStatus, "ok">, string> = {
  archived: "Dompet diarsipkan",
  deleted: "Dompet sudah dihapus",
};

export function GoalList({ onEdit }: { onEdit: (goal: Goal) => void }) {
  const { data, isPending, error, refetch } = useGoals();
  const remove = useDeleteGoal();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) return <ReportLoading label="Memuat target" />;
  if (error) return <ReportError error={error} onRetry={() => refetch()} />;
  if (data.length === 0) {
    return (
      <EmptyState
        title="Belum ada target tabungan"
        description="Buat target untuk dana darurat, liburan, atau barang impian, lalu pantau progresnya dari saldo dompet."
      />
    );
  }

  const onDelete = async (g: Goal) => {
    if (!confirm(`Hapus target "${g.name}"?`)) return;
    setActionError(null);
    try {
      await remove.mutateAsync(g.id);
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
        {data.map((g) => {
          const s = STATUS[g.status];
          const width = Math.min(100, Math.max(0, g.percent));

          return (
            <li key={g.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{g.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{g.wallet_name}</p>
                  {g.wallet_status !== "ok" && (
                    <p className="mt-0.5 text-sm font-medium text-warning">
                      <span aria-hidden="true">! </span>
                      {WALLET_WARNING[g.wallet_status]}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" aria-label={`Ubah ${g.name}`} onClick={() => onEdit(g)}>
                    Ubah
                  </Button>
                  <Button variant="destructive" size="sm" aria-label={`Hapus ${g.name}`} disabled={remove.isPending} onClick={() => onDelete(g)}>
                    Hapus
                  </Button>
                </div>
              </div>

              <div
                role="meter"
                aria-label={g.name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={g.percent}
                aria-valuetext={`${g.percent}%`}
                className="mt-3 h-2 rounded-full bg-muted"
              >
                <div className={`h-full rounded-r-full rounded-l-sm ${s.bar}`} style={{ width: `${width}%` }} />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                <span data-status={g.status} className="inline-flex items-center gap-1.5 font-medium">
                  <span aria-hidden="true" className={`font-bold ${s.iconTone}`}>
                    {s.icon}
                  </span>
                  {s.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {`${nb(formatRupiah(g.current_amount))} dari ${nb(formatRupiah(g.target_amount))}`}
                </span>
              </div>

              {g.deadline && <p className="mt-1 text-sm text-muted-foreground">Tenggat {formatDate(g.deadline)}</p>}
              {g.monthly_needed !== null && (
                <p className="mt-0.5 text-sm text-muted-foreground">Perlu {nb(formatRupiah(g.monthly_needed))} per bulan</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
