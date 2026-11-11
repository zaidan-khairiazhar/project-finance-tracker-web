"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { useCategories } from "@/features/categories/api";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { formatNumber } from "@/lib/format";
import { useBudgets, useUpsertBudget, type Budget } from "./api";
import { budgetSchema, type BudgetFormInput, type BudgetValues } from "./schema";

type Props = { month: string; budget?: Budget; onDone: () => void };

export function BudgetForm({ month, budget, onDone }: Props) {
  const upsert = useUpsertBudget();
  const categories = useCategories("expense");
  const budgets = useBudgets(month);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormInput, unknown, BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category_id: budget?.category_id ?? "", amount: budget ? formatNumber(budget.amount) : "" },
  });

  const all = categories.data ?? [];
  const byId = new Map(all.map((c) => [c.id, c]));
  const taken = new Set((budgets.data ?? []).map((b) => b.category_id));
  const options = all
    .filter((c) => !taken.has(c.id))
    .map((c) => {
      const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
      return { id: c.id, label: parent ? `${parent.name} › ${c.name}` : c.name };
    });

  const loaded = categories.isSuccess && budgets.isSuccess;
  const noCategories = loaded && all.length === 0;
  const nothingLeft = loaded && all.length > 0 && options.length === 0;
  const blocked = !budget && (noCategories || nothingLeft);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await upsert.mutateAsync(values);
      onDone();
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="budget-category" label="Kategori" error={errors.category_id} hint={budget ? "Kategori tidak bisa diubah. Hapus lalu buat ulang untuk mengganti." : undefined}>
        <select id="budget-category" disabled={!!budget} aria-invalid={errors.category_id ? true : undefined} className={inputClass} {...register("category_id")}>
          {budget ? (
            <option value={budget.category_id}>{budget.category_name}</option>
          ) : (
            <>
              <option value="">Pilih kategori</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </>
          )}
        </select>
      </FormField>

      {!budget && noCategories && (
        <p className="text-sm text-muted-foreground">Belum ada kategori pengeluaran. Buat dulu di halaman Kategori.</p>
      )}
      {!budget && nothingLeft && <p className="text-sm text-muted-foreground">Semua kategori pengeluaran sudah punya anggaran.</p>}

      <FormField id="budget-amount" label="Batas per bulan (Rp)" error={errors.amount} hint="Berlaku setiap bulan sampai kamu ubah.">
        <input id="budget-amount" inputMode="numeric" placeholder="1.500.000" aria-invalid={errors.amount ? true : undefined} className={inputClass} {...register("amount")} />
      </FormField>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || blocked}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
