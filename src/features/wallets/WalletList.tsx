"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { useDeleteWallet, useUpdateWallet, useWallets, type Wallet } from "./api";
import { walletTypeLabels } from "./schema";

const messageOf = (error: unknown) => (error instanceof ApiError ? (error.errors ? Object.values(error.errors)[0]?.[0] : undefined) ?? error.message : "Terjadi kesalahan. Coba lagi.");

export function WalletList({ onEdit }: { onEdit: (wallet: Wallet) => void }) {
  const { data, isPending, error, refetch } = useWallets();
  const update = useUpdateWallet();
  const remove = useDeleteWallet();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>, success?: (result: unknown) => string | null) => {
    setNotice(null);
    setActionError(null);
    try {
      const result = await action();
      setNotice(success?.(result) ?? null);
    } catch (e) {
      setActionError(messageOf(e));
    }
  };

  if (isPending) {
    return (
      <div role="status" aria-label="Memuat dompet" className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
        <p className="text-destructive">{messageOf(error)}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title="Belum ada dompet" description="Tambahkan dompet pertamamu, misalnya rekening bank atau uang tunai." />;
  }

  return (
    <div className="space-y-3">
      {notice && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{notice}</p>}
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {data.map((w) => (
          <li key={w.id} className={`rounded-lg border border-border bg-card p-4 ${w.is_archived ? "opacity-70" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{w.name}</p>
                <p className="text-xs text-muted-foreground">{walletTypeLabels[w.type]}</p>
              </div>
              {w.is_archived && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Diarsipkan</span>}
            </div>
            <p className="mt-3 text-xl font-semibold tabular-nums">{formatRupiah(w.balance)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" aria-label={`Ubah ${w.name}`} onClick={() => onEdit(w)}>
                Ubah
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label={`${w.is_archived ? "Aktifkan" : "Arsipkan"} ${w.name}`}
                disabled={update.isPending}
                onClick={() => run(() => update.mutateAsync({ id: w.id, is_archived: !w.is_archived }))}
              >
                {w.is_archived ? "Aktifkan" : "Arsipkan"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                aria-label={`Hapus ${w.name}`}
                disabled={remove.isPending}
                onClick={() => {
                  if (!confirm(`Hapus dompet "${w.name}"? Jika sudah punya transaksi, dompet hanya diarsipkan.`)) return;
                  run(
                    () => remove.mutateAsync(w.id),
                    (result) => (result ? `"${w.name}" punya transaksi, jadi diarsipkan (bukan dihapus).` : null),
                  );
                }}
              >
                Hapus
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
