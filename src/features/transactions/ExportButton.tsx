"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { downloadFile } from "@/lib/download";
import { exportTransactions, type TransactionFilters } from "./api";

/** Unduh transaksi yang sedang difilter sebagai CSV. */
export function ExportButton({ filters }: { filters: TransactionFilters }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const { blob, filename } = await exportTransactions(filters);
      downloadFile(blob, filename);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mengekspor. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="outline" disabled={busy} onClick={run}>
        {busy ? "Mengekspor…" : "Ekspor CSV"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
