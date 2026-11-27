"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useCategories } from "@/features/categories/api";
import { useCreateTransaction } from "@/features/transactions/api";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { todayJakarta } from "@/features/recurring/schema";
import { compressImage } from "@/lib/image";
import { scanReceipt, useUploadReceipt, type ReceiptSuggestion } from "./api";
import { suggestionToFormValues } from "./suggestion";

type Session = {
  file: File;
  previewUrl: string;
  suggestion: ReceiptSuggestion | null;
  scanFailed: boolean;
};

/** Tombol "Scan struk": foto → saran isian → form transaksi → simpan + unggah foto. Tidak menyimpan apa pun di luar state. */
export function ReceiptScanFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const create = useCreateTransaction();
  const upload = useUploadReceipt();
  // Nilai awal select kategori hanya berlaku bila opsinya sudah ada, jadi form menunggu daftar kategori.
  const categories = useCategories();

  const previewRef = useRef<string | null>(null);
  useEffect(() => {
    previewRef.current = session?.previewUrl ?? null;
  }, [session]);
  // Cabut URL pratinjau saat komponen dilepas.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function reset() {
    if (session) URL.revokeObjectURL(session.previewUrl);
    setSession(null);
    setSavedId(null);
    setUploadFailed(false);
    setRetrying(false);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    e.target.value = "";
    if (!original) return;
    setReading(true);
    const file = await compressImage(original);
    let suggestion: ReceiptSuggestion | null = null;
    let scanFailed = false;
    try {
      suggestion = await scanReceipt(file);
    } catch {
      scanFailed = true;
    }
    setReading(false);
    setSession({ file, previewUrl: URL.createObjectURL(file), suggestion, scanFailed });
  }

  async function save(values: Parameters<typeof create.mutateAsync>[0]) {
    if (!session) return;
    let id = savedId;
    if (!id) {
      id = (await create.mutateAsync(values)).data.id; // galat dibiarkan naik: form menampilkannya
      setSavedId(id);
    }
    try {
      await upload.mutateAsync({ id, file: session.file });
      reset();
    } catch {
      setUploadFailed(true);
    }
  }

  async function retryUpload() {
    if (!session || !savedId) return;
    setRetrying(true);
    try {
      await upload.mutateAsync({ id: savedId, file: session.file });
      reset();
    } catch {
      setRetrying(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={reading}>
        Scan struk
      </Button>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      {reading && (
        <p role="status" className="self-center text-sm text-muted-foreground">
          Membaca struk…
        </p>
      )}

      <Dialog open={session !== null} onClose={reset} title="Tambah transaksi dari struk">
        {session && (
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={session.previewUrl} alt="Foto struk" className="mx-auto max-h-48 rounded-md border border-border object-contain" />
            {session.scanFailed && !savedId && (
              <p role="alert" className="text-sm text-destructive">
                Tidak bisa membaca struk otomatis, isi manual.
              </p>
            )}
            {!savedId && categories.isPending && (
              <p role="status" className="text-sm text-muted-foreground">
                Memuat kategori…
              </p>
            )}
            {!savedId ? (
              categories.isPending ? null : <TransactionForm
                defaultValues={suggestionToFormValues(session.suggestion, todayJakarta())}
                onCancel={reset}
                onSubmit={save}
              />
            ) : (
              uploadFailed && (
                <div className="space-y-3">
                  <p role="alert" className="text-sm text-destructive">
                    Transaksi tersimpan, tetapi foto struk gagal diunggah.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={reset}>
                      Lewati
                    </Button>
                    <Button onClick={retryUpload} disabled={retrying}>
                      Coba unggah lagi
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
