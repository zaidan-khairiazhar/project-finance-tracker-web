"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { currentMonth, formatRupiah, monthRange } from "@/lib/format";
import { useWalletReport } from "./api";
import { RangePicker } from "./RangePicker";
import { ReportError, ReportLoading } from "./ReportStatus";

const COLUMNS = [
  ["Pemasukan", "income"],
  ["Pengeluaran", "expense"],
  ["Transfer masuk", "transfer_in"],
  ["Transfer keluar", "transfer_out"],
  ["Saldo akhir", "closing_balance"],
] as const;

export function WalletTab({ now }: { now?: Date }) {
  const [range, setRange] = useState(() => monthRange(currentMonth(now)));
  const query = useWalletReport(range);

  return (
    <section aria-labelledby="wallet-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="wallet-title" className="font-medium">Ringkasan per dompet</h2>
        <RangePicker value={range} onChange={setRange} />
      </div>

      {query.isPending ? (
        <ReportLoading label="Memuat dompet" />
      ) : query.error ? (
        <ReportError error={query.error} onRetry={() => query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState title="Belum ada dompet untuk dilaporkan" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Ringkasan per dompet pada rentang terpilih</caption>
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="py-2 pr-3 text-left font-medium">Dompet</th>
                {COLUMNS.map(([label]) => (
                  <th key={label} scope="col" className="whitespace-nowrap px-2 py-2 text-right font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {query.data.map((w) => (
                <tr key={w.wallet_id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="whitespace-nowrap py-2 pr-3 text-left font-normal">
                    {w.name}
                    {w.is_archived && <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">Diarsipkan</span>}
                  </th>
                  {COLUMNS.map(([label, key]) => (
                    <td key={label} className={`whitespace-nowrap px-2 py-2 text-right tabular-nums ${key === "closing_balance" ? "font-medium" : ""}`}>
                      {formatRupiah(w[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
