"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api";
import { useRunRecurring, type RecurringRule } from "./api";
import { RecurringForm } from "./RecurringForm";
import { RecurringList } from "./RecurringList";

export function RecurringView() {
  // undefined = tertutup, null = tambah, RecurringRule = ubah
  const [editing, setEditing] = useState<RecurringRule | null | undefined>(undefined);
  const close = () => setEditing(undefined);
  const run = useRunRecurring();

  return (
    <>
      <PageHeader
        title="Berulang"
        description="Transaksi yang tercatat otomatis sesuai jadwal."
        action={
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" disabled={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? "Menjalankan..." : "Jalankan sekarang"}
            </Button>
            <Button onClick={() => setEditing(null)}>Tambah aturan</Button>
          </div>
        }
      />
      {run.isSuccess && (
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          {run.data.created} transaksi dibuat
        </p>
      )}
      {run.isError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {run.error instanceof ApiError ? run.error.message : "Gagal menjalankan jadwal. Coba lagi."}
        </p>
      )}
      <RecurringList onEdit={setEditing} />
      <Dialog open={editing !== undefined} onClose={close} title={editing ? "Ubah aturan" : "Tambah aturan"}>
        <RecurringForm rule={editing ?? undefined} onDone={close} />
      </Dialog>
    </>
  );
}
