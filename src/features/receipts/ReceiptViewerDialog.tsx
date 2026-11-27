"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Transaction } from "@/features/transactions/api";
import { receiptUrl } from "./api";
import { receiptTitle } from "./receipt-title";

/** Penampil foto struk. Terbuka selama `transaction` ada. */
export function ReceiptViewerDialog({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  return (
    <Dialog open={transaction !== null} onClose={onClose} title="Foto struk">
      {transaction && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={receiptUrl(transaction.id)} alt={`Struk ${receiptTitle(transaction)}`} className="mx-auto max-h-[70vh] w-full rounded-md object-contain" />
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
