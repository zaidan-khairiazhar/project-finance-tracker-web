"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { ReceiptScanFlow } from "@/features/receipts/ReceiptScanFlow";
import { ReceiptSection } from "@/features/receipts/ReceiptSection";
import { ReceiptViewerDialog } from "@/features/receipts/ReceiptViewerDialog";
import { useCreateTransaction, useUpdateTransaction, type Transaction, type TransactionFilters as Filters } from "@/features/transactions/api";
import { ExportButton } from "@/features/transactions/ExportButton";
import { TransactionFilters } from "@/features/transactions/TransactionFilters";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { TransactionTable } from "@/features/transactions/TransactionTable";
import type { TransactionFormValues } from "@/features/transactions/schema";
import { TransferDialog } from "@/features/wallets/TransferDialog";
import { toInputValue } from "@/lib/format";

function toFormValues(t: Transaction): Partial<TransactionFormValues> {
  return {
    type: t.type === "income" ? "income" : "expense",
    amount: t.amount,
    wallet_id: t.wallet_id,
    category_id: t.category_id ?? "",
    occurred_at: toInputValue(t.occurred_at),
    note: t.note ?? "",
  };
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({});
  // undefined = tertutup, null = tambah, Transaction = ubah
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined);
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const close = () => setEditing(undefined);

  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Semua pemasukan, pengeluaran, dan transfer."
        action={
          <div className="flex items-start gap-2">
            <ExportButton filters={filters} />
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              Transfer
            </Button>
            <ReceiptScanFlow />
            <Button onClick={() => setEditing(null)}>Tambah transaksi</Button>
          </div>
        }
      />
      <TransactionFilters value={filters} onChange={setFilters} />
      <TransactionTable filters={filters} onEdit={setEditing} onViewReceipt={setViewing} />

      <Dialog open={editing !== undefined} onClose={close} title={editing ? "Ubah transaksi" : "Tambah transaksi"}>
        <TransactionForm
          defaultValues={editing ? toFormValues(editing) : undefined}
          onCancel={close}
          onSubmit={async (values) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...values });
            else await create.mutateAsync(values);
            close();
          }}
        />
        {editing && (editing.type === "income" || editing.type === "expense") && <ReceiptSection key={editing.id} transaction={editing} />}
      </Dialog>
      <ReceiptViewerDialog transaction={viewing} onClose={() => setViewing(null)} />
      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
    </>
  );
}
