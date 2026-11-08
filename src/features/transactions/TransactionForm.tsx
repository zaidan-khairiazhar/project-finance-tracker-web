"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { useCategories, type Category } from "@/features/categories/api";
import { useWallets } from "@/features/wallets/api";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { formatNumber, nowForInput } from "@/lib/format";
import { transactionSchema, transactionTypeLabels, transactionTypes, type TransactionFormValues, type TransactionValues } from "./schema";

type Props = {
  defaultValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionValues) => Promise<void>;
  onCancel?: () => void;
};

/** Induk (A-Z) diikuti anaknya; anak diberi awalan "— " supaya terlihat menjorok di dalam <select>. */
function categoryOptions(items: Category[]) {
  const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, "id");
  const ids = new Set(items.map((c) => c.id));
  const roots = items.filter((c) => !c.parent_id || !ids.has(c.parent_id)).sort(byName);

  return roots.flatMap((root) => [
    { id: root.id, label: root.name },
    ...items
      .filter((c) => c.parent_id === root.id)
      .sort(byName)
      .map((c) => ({ id: c.id, label: `— ${c.name}` })),
  ]);
}

export function TransactionForm({ defaultValues, onSubmit, onCancel }: Props) {
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();
  const activeWallets = wallets.filter((w) => !w.is_archived);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues, unknown, TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      wallet_id: activeWallets[0]?.id ?? "",
      category_id: "",
      occurred_at: nowForInput(),
      note: "",
      ...defaultValues,
      amount: typeof defaultValues?.amount === "number" ? formatNumber(defaultValues.amount) : (defaultValues?.amount ?? ""),
    },
  });

  // Daftar dompet bisa tiba setelah form tampil: pilih dompet aktif pertama jika belum ada pilihan.
  const firstActiveId = activeWallets[0]?.id;
  useEffect(() => {
    if (firstActiveId && !getValues("wallet_id")) setValue("wallet_id", firstActiveId);
  }, [firstActiveId, getValues, setValue]);

  const type = useWatch({ control, name: "type" });
  const options = categoryOptions(categories.filter((c) => c.type === type));

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Tipe</legend>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
          {transactionTypes.map((t) => (
            <label key={t} className="cursor-pointer">
              <input
                type="radio"
                value={t}
                className="peer sr-only"
                {...register("type", { onChange: () => setValue("category_id", "") })}
              />
              <span className="flex h-9 items-center justify-center rounded-sm text-sm font-medium text-muted-foreground transition-colors peer-checked:bg-card peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring/40">
                {transactionTypeLabels[t]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <FormField id="tx-amount" label="Jumlah (Rp)" error={errors.amount}>
        <input
          id="tx-amount"
          inputMode="numeric"
          placeholder="0"
          aria-invalid={errors.amount ? true : undefined}
          className={inputClass}
          {...register("amount")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="tx-wallet" label="Dompet" error={errors.wallet_id}>
          <select id="tx-wallet" aria-invalid={errors.wallet_id ? true : undefined} className={inputClass} {...register("wallet_id")}>
            {activeWallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField id="tx-category" label="Kategori" error={errors.category_id} hint="Opsional.">
          <select id="tx-category" className={inputClass} {...register("category_id")}>
            <option value="">Tanpa kategori</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField id="tx-time" label="Waktu (WIB)" error={errors.occurred_at}>
        <input id="tx-time" type="datetime-local" aria-invalid={errors.occurred_at ? true : undefined} className={inputClass} {...register("occurred_at")} />
      </FormField>

      <FormField id="tx-note" label="Catatan" error={errors.note} hint="Opsional.">
        <input id="tx-note" maxLength={255} placeholder="mis. makan siang" className={inputClass} {...register("note")} />
      </FormField>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
