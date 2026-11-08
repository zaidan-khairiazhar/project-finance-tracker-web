"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import type { Wallet } from "@/features/wallets/api";
import { WalletForm } from "@/features/wallets/WalletForm";
import { TransferDialog } from "@/features/wallets/TransferDialog";
import { WalletList } from "@/features/wallets/WalletList";

export default function WalletsPage() {
  // undefined = tertutup, null = tambah, Wallet = ubah
  const [editing, setEditing] = useState<Wallet | null | undefined>(undefined);
  const [transferOpen, setTransferOpen] = useState(false);
  const close = () => setEditing(undefined);

  return (
    <>
      <PageHeader
        title="Dompet"
        description="Saldo dihitung otomatis dari transaksi."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              Transfer
            </Button>
            <Button onClick={() => setEditing(null)}>Tambah dompet</Button>
          </div>
        }
      />
      <WalletList onEdit={setEditing} />
      <Dialog open={editing !== undefined} onClose={close} title={editing ? "Ubah dompet" : "Tambah dompet"}>
        <WalletForm wallet={editing ?? undefined} onDone={close} />
      </Dialog>
      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
    </>
  );
}
