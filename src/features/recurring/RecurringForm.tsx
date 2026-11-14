"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { useCategories } from "@/features/categories/api";
import { useWallets } from "@/features/wallets/api";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { formatNumber } from "@/lib/format";
import { useCreateRecurringRule, useUpdateRecurringRule, type RecurringRule } from "./api";
import {
  minStartDate,
  recurringEditSchema,
  recurringSchema,
  todayJakarta,
  type RecurringFormInput,
  type RecurringValues,
} from "./schema";

type Props = { rule?: RecurringRule; onDone: () => void };

const LOCKED_HINT = "Tidak bisa diubah. Hapus lalu buat ulang untuk mengganti.";

export function RecurringForm({ rule, onDone }: Props) {
  const create = useCreateRecurringRule();
  const update = useUpdateRecurringRule();
  const wallets = useWallets();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecurringFormInput, unknown, RecurringValues>({
    resolver: zodResolver(rule ? recurringEditSchema : recurringSchema),
    defaultValues: {
      type: rule?.type ?? "expense",
      wallet_id: rule?.wallet_id ?? "",
      category_id: rule?.category_id ?? "",
      amount: rule ? formatNumber(rule.amount) : "",
      note: rule?.note ?? "",
      frequency: rule?.frequency ?? "monthly",
      start_date: rule?.start_date ?? todayJakarta(),
      end_date: rule?.end_date ?? "",
    },
  });

  const type = useWatch({ control, name: "type" });
  const startDate = useWatch({ control, name: "start_date" });
  const categories = useCategories(type);

  const all = categories.data ?? [];
  const byId = new Map(all.map((c) => [c.id, c]));
  const categoryOptions = all.map((c) => {
    const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
    return { id: c.id, label: parent ? `${parent.name} › ${c.name}` : c.name };
  });
  // Dompet arsip tidak ditawarkan, kecuali dompet milik aturan yang sedang diubah.
  const walletOptions = (wallets.data ?? []).filter((w) => !w.is_archived || w.id === rule?.wallet_id);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (rule) {
        // Frekuensi, tanggal mulai, dan tipe tidak boleh ada di body PATCH (server menolak kuncinya, bukan nilainya).
        await update.mutateAsync({
          id: rule.id,
          wallet_id: values.wallet_id,
          category_id: values.category_id,
          amount: values.amount,
          note: values.note,
          end_date: values.end_date,
        });
      } else {
        await create.mutateAsync(values);
      }
      onDone();
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  const locked = !!rule;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="recurring-type" label="Tipe" error={errors.type} hint={locked ? LOCKED_HINT : undefined}>
        <select
          id="recurring-type"
          disabled={locked}
          className={inputClass}
          {...register("type", { onChange: () => setValue("category_id", "") })}
        >
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
      </FormField>

      <FormField id="recurring-wallet" label="Dompet" error={errors.wallet_id}>
        <select key={String(wallets.isSuccess)} id="recurring-wallet" aria-invalid={errors.wallet_id ? true : undefined} className={inputClass} {...register("wallet_id")}>
          <option value="">Pilih dompet</option>
          {walletOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="recurring-category" label="Kategori" error={errors.category_id}>
        <select key={`${type}-${categories.isSuccess}`} id="recurring-category" aria-invalid={errors.category_id ? true : undefined} className={inputClass} {...register("category_id")}>
          <option value="">Tanpa kategori</option>
          {categoryOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="recurring-amount" label="Nominal (Rp)" error={errors.amount} hint={rule ? "Perubahan nominal hanya berlaku untuk transaksi berikutnya." : undefined}>
        <input id="recurring-amount" inputMode="numeric" placeholder="1.500.000" aria-invalid={errors.amount ? true : undefined} className={inputClass} {...register("amount")} />
      </FormField>

      <FormField id="recurring-note" label="Catatan (opsional)" error={errors.note}>
        <input id="recurring-note" maxLength={255} aria-invalid={errors.note ? true : undefined} className={inputClass} {...register("note")} />
      </FormField>

      <FormField id="recurring-frequency" label="Frekuensi" error={errors.frequency} hint={locked ? LOCKED_HINT : undefined}>
        <select id="recurring-frequency" disabled={locked} className={inputClass} {...register("frequency")}>
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
        </select>
      </FormField>

      <FormField
        id="recurring-start"
        label="Tanggal mulai"
        error={errors.start_date}
        hint={locked ? LOCKED_HINT : "Tanggal yang sudah lewat langsung dicatat (maksimal 366 hari ke belakang)."}
      >
        <input
          id="recurring-start"
          type="date"
          disabled={locked}
          min={locked ? undefined : minStartDate()}
          aria-invalid={errors.start_date ? true : undefined}
          className={inputClass}
          {...register("start_date")}
        />
      </FormField>

      <FormField id="recurring-end" label="Tanggal akhir (opsional)" error={errors.end_date} hint="Kosongkan agar berjalan terus.">
        <input id="recurring-end" type="date" min={startDate || undefined} aria-invalid={errors.end_date ? true : undefined} className={inputClass} {...register("end_date")} />
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
