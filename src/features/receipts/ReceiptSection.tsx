"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/features/transactions/api";
import { ApiError } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { receiptUrl, useDeleteReceipt, useUploadReceipt } from "./api";
import { receiptTitle } from "./receipt-title";

const messageOf = (error: unknown) => (error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi.");

/**
 * Bagian "Struk" pada form ubah transaksi. `has_receipt` disimpan lokal (diinisialisasi dari transaksi)
 * karena objek `editing` di halaman hanyalah snapshot; keadaan diperbarui dari hasil mutasi.
 */
export function ReceiptSection({ transaction }: { transaction: Transaction }) {
  const upload = useUploadReceipt();
  const remove = useDeleteReceipt();
  const [hasReceipt, setHasReceipt] = useState(transaction.has_receipt);
  const [version, setVersion] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const busy = processing || upload.isPending || remove.isPending;
  const uploading = processing || upload.isPending;
  const title = receiptTitle(transaction);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // izinkan memilih file yang sama lagi
    if (!file) return;

    setError(null);
    setProcessing(true);
    try {
      const small = await compressImage(file);
      await upload.mutateAsync({ id: transaction.id, file: small });
      setHasReceipt(true);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setProcessing(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("Hapus foto struk ini?")) return;

    setError(null);
    try {
      await remove.mutateAsync({ id: transaction.id });
      setHasReceipt(false);
    } catch (err) {
      setError(messageOf(err));
    }
  };

  return (
    <section aria-labelledby="receipt-heading" className="mt-6 border-t border-border pt-4">
      <h3 id="receipt-heading" className="mb-3 text-sm font-medium">Struk</h3>

      {error && (
        <p role="alert" className="mb-3 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {hasReceipt && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${receiptUrl(transaction.id)}${version ? `?v=${version}` : ""}`}
          alt={`Struk ${title}`}
          className="mb-3 max-h-40 rounded-md border border-border object-contain"
        />
      )}

      <input ref={input} type="file" accept="image/*" hidden onChange={onFile} />

      <div className="flex flex-wrap items-center gap-2">
        {hasReceipt ? (
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              Ganti foto
            </Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={onDelete}>
              Hapus foto
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            Tambah foto struk
          </Button>
        )}
        {uploading && <span role="status" className="text-sm text-muted-foreground">Mengunggah…</span>}
      </div>
    </section>
  );
}
