"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import type { Goal } from "./api";
import { GoalForm } from "./GoalForm";
import { GoalList } from "./GoalList";

export function GoalsView() {
  // undefined = tertutup, null = tambah, Goal = ubah
  const [editing, setEditing] = useState<Goal | null | undefined>(undefined);
  const close = () => setEditing(undefined);

  return (
    <>
      <PageHeader
        title="Target"
        description="Pantau progres tabungan dari saldo dompet."
        action={<Button onClick={() => setEditing(null)}>Tambah target</Button>}
      />
      <GoalList onEdit={setEditing} />
      <Dialog open={editing !== undefined} onClose={close} title={editing ? "Ubah target" : "Tambah target"}>
        <GoalForm goal={editing ?? undefined} onDone={close} />
      </Dialog>
    </>
  );
}
