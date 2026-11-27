"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/features/categories/api";
import { useWallets } from "@/features/wallets/api";
import { ApiError } from "@/lib/api";
import { formatDate, formatRupiah } from "@/lib/format";
import { useDeleteTransaction, useDeleteTransfer, useTransactions, type Transaction, type TransactionFilters } from "./api";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? (error.errors ? Object.values(error.errors)[0]?.[0] : undefined) ?? error.message
    : "Terjadi kesalahan. Coba lagi.";

const isTransfer = (t: Transaction) => t.type === "transfer_out" || t.type === "transfer_in";
const SIGN: Record<Transaction["type"], string> = { income: "+", transfer_in: "+", expense: "-", transfer_out: "-" };
const AMOUNT_COLOR: Record<Transaction["type"], string> = {
  income: "text-income",
  expense: "text-expense",
  transfer_in: "text-muted-foreground",
  transfer_out: "text-muted-foreground",
};

const PaperclipIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

type Props = { filters: TransactionFilters; onEdit: (transaction: Transaction) => void; onViewReceipt?: (transaction: Transaction) => void };

export function TransactionTable({ filters, onEdit, onViewReceipt }: Props) {
  const { data, isPending, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactions(filters);
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();
  const removeTransaction = useDeleteTransaction();
  const removeTransfer = useDeleteTransfer();
  const [actionError, setActionError] = useState<string | null>(null);

  // Muat halaman berikutnya otomatis saat bagian bawah daftar terlihat (tombol "Muat lagi" tetap ada sebagai cadangan).
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <div role="status" aria-label="Memuat transaksi" className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14" />
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

  const rows = data.pages.flatMap((page) => page.data);

  if (rows.length === 0) {
    const filtered = Object.values(filters).some(Boolean);
    return (
      <EmptyState
        title="Belum ada transaksi"
        description={filtered ? "Tidak ada transaksi yang cocok dengan filter. Coba ubah atau reset filternya." : "Catat pemasukan atau pengeluaran pertamamu lewat tombol Tambah transaksi."}
      />
    );
  }

  const walletName = (id: string) => wallets.find((w) => w.id === id)?.name ?? "Dompet";
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name;

  const onDelete = async (t: Transaction) => {
    const transfer = isTransfer(t);
    const ok = confirm(
      transfer ? "Hapus transfer ini? Kedua sisinya (keluar dan masuk) akan dihapus." : "Hapus transaksi ini? Saldo dompet akan dihitung ulang.",
    );
    if (!ok) return;

    setActionError(null);
    try {
      if (transfer) await removeTransfer.mutateAsync(t.transfer_group_id!);
      else await removeTransaction.mutateAsync(t.id);
    } catch (e) {
      setActionError(messageOf(e));
    }
  };

  const busy = removeTransaction.isPending || removeTransfer.isPending;

  return (
    <div className="space-y-4">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">Daftar transaksi</caption>
          <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="w-28 px-4 py-2.5 font-medium">Tanggal</th>
              <th scope="col" className="px-2 py-2.5 font-medium">Keterangan</th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium">Jumlah</th>
              <th scope="col" className="w-px px-4 py-2.5"><span className="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((t) => {
              const transfer = isTransfer(t);
              const title = transfer ? (t.type === "transfer_out" ? "Transfer keluar" : "Transfer masuk") : (categoryName(t.category_id) ?? "Tanpa kategori");

              return (
                <tr key={t.id}>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-muted-foreground">{formatDate(t.occurred_at)}</td>
                  <td className="px-2 py-3 align-top">
                    <p className={`font-medium ${!transfer && !t.category_id ? "text-muted-foreground" : ""}`}>{title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span>{walletName(t.wallet_id)}</span>
                      {t.recurring_rule_id && (
                        <>
                          {" · "}
                          <span className="rounded border border-border px-1 py-px text-[11px] font-medium text-foreground/80">Otomatis</span>
                        </>
                      )}
                      {t.note && (
                        <>
                          {" · "}
                          <span>{t.note}</span>
                        </>
                      )}
                    </p>
                  </td>
                  <td className={`whitespace-nowrap px-2 py-3 text-right align-top font-semibold tabular-nums ${AMOUNT_COLOR[t.type]}`}>
                    {SIGN[t.type]}
                    {formatRupiah(t.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right align-top">
                    {t.has_receipt && (
                      <Button variant="ghost" size="sm" aria-label={`Lihat struk ${t.note || "transaksi"}`} onClick={() => onViewReceipt?.(t)}>
                        <PaperclipIcon />
                      </Button>
                    )}
                    {!transfer && (
                      <Button variant="ghost" size="sm" aria-label={`Ubah transaksi ${title}`} onClick={() => onEdit(t)}>
                        Ubah
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-destructive" aria-label={`Hapus ${transfer ? "transfer" : "transaksi"} ${title}`} disabled={busy} onClick={() => onDelete(t)}>
                      Hapus
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div ref={sentinel} className="flex justify-center">
          <Button variant="outline" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? "Memuat..." : "Muat lagi"}
          </Button>
        </div>
      )}
    </div>
  );
}
