"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportError, ReportLoading } from "@/features/reports/ReportStatus";
import { ApiError } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { useDeleteRecurringRule, useRecurringRules, useUpdateRecurringRule, type RecurringRule, type RecurringStatus } from "./api";
import { describeSchedule, pausedReasonText } from "./schedule";

// Spasi tak terputus agar "Rp" tidak terpisah dari angkanya saat baris membungkus di layar sempit.
const nb = (text: string) => text.replace("Rp ", "Rp ");

const messageOf = (e: unknown) => (e instanceof ApiError ? e.message : "Terjadi kesalahan. Coba lagi.");

// Status selalu berupa kata + ikon, tidak hanya warna.
const STATUS: Record<RecurringStatus, { label: string; icon: string; iconTone: string }> = {
  active: { label: "Aktif", icon: "●", iconTone: "text-income" },
  paused: { label: "Dijeda", icon: "‖", iconTone: "text-warning" },
  finished: { label: "Selesai", icon: "✓", iconTone: "text-muted-foreground" },
};

const titleOf = (r: RecurringRule) => r.category_name ?? r.note ?? r.wallet_name;

function statusText(r: RecurringRule) {
  if (r.status !== "paused") return STATUS[r.status].label;
  const reason = pausedReasonText(r.paused_reason);
  return reason ? `Dijeda · ${reason}` : "Dijeda";
}

export function RecurringList({ onEdit }: { onEdit: (rule: RecurringRule) => void }) {
  const { data, isPending, error, refetch } = useRecurringRules();
  const update = useUpdateRecurringRule();
  const remove = useDeleteRecurringRule();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) return <ReportLoading label="Memuat transaksi berulang" />;
  if (error) return <ReportError error={error} onRetry={() => refetch()} />;
  if (data.length === 0) {
    return (
      <EmptyState
        title="Belum ada transaksi berulang"
        description="Buat aturan untuk gaji, tagihan, atau langganan agar transaksinya tercatat otomatis."
      />
    );
  }

  const run = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(messageOf(e));
    }
  };
  const onToggle = (r: RecurringRule) => run(() => update.mutateAsync({ id: r.id, is_active: !r.is_active }));
  const onDelete = (r: RecurringRule) => {
    if (!confirm(`Hapus aturan berulang "${titleOf(r)}"?`)) return;
    return run(() => remove.mutateAsync(r.id));
  };
  const busy = update.isPending || remove.isPending;

  return (
    <div className="space-y-3">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}
      <ul className="space-y-3">
        {data.map((r) => {
          const s = STATUS[r.status];
          const title = titleOf(r);

          return (
            <li key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{describeSchedule(r)}</p>
                </div>
                <p className={`shrink-0 font-medium tabular-nums ${r.type === "income" ? "text-income" : "text-expense"}`}>
                  {r.type === "income" ? "+" : "-"}
                  {nb(formatRupiah(r.amount))}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
                <div className="min-w-0">
                  <span data-status={r.status} className="inline-flex items-center gap-1.5 font-medium">
                    <span aria-hidden="true" className={`font-bold ${s.iconTone}`}>
                      {s.icon}
                    </span>
                    {statusText(r)}
                  </span>
                  <p className="text-muted-foreground">
                    {r.status === "finished" ? `Berakhir ${formatDate(r.end_date ?? r.next_due_date)}` : `Berikutnya ${formatDate(r.next_due_date)}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {r.status !== "finished" && (
                    <Button variant="ghost" size="sm" aria-label={`${r.is_active ? "Jeda" : "Aktifkan"} ${title}`} disabled={busy} onClick={() => onToggle(r)}>
                      {r.is_active ? "Jeda" : "Aktifkan"}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" aria-label={`Ubah ${title}`} onClick={() => onEdit(r)}>
                    Ubah
                  </Button>
                  <Button variant="destructive" size="sm" aria-label={`Hapus ${title}`} disabled={busy} onClick={() => onDelete(r)}>
                    Hapus
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
