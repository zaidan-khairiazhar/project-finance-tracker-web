"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { MonthPicker } from "@/features/dashboard/MonthPicker";
import type { Budget } from "./api";
import { BudgetForm } from "./BudgetForm";
import { BudgetList } from "./BudgetList";

export function BudgetsView({ initialMonth, currentMonth }: { initialMonth: string; currentMonth: string }) {
  const [month, setMonth] = useState(initialMonth);
  // undefined = tertutup, null = tambah, Budget = ubah
  const [editing, setEditing] = useState<Budget | null | undefined>(undefined);
  const close = () => setEditing(undefined);

  return (
    <>
      <PageHeader
        title="Anggaran"
        description="Batas pengeluaran bulanan per kategori. Anggaran kategori induk menjumlah subkategorinya."
        action={<Button onClick={() => setEditing(null)}>Atur anggaran</Button>}
      />
      <div className="mb-4">
        <MonthPicker value={month} max={currentMonth} onChange={setMonth} />
      </div>
      <BudgetList month={month} onEdit={setEditing} />
      <Dialog open={editing !== undefined} onClose={close} title={editing ? "Ubah anggaran" : "Atur anggaran"}>
        <BudgetForm month={month} budget={editing ?? undefined} onDone={close} />
      </Dialog>
    </>
  );
}
