"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormField, inputClass } from "@/components/ui/form";
import { useCreateTransfer } from "@/features/transactions/api";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { nowForInput } from "@/lib/format";
import { useWallets } from "./api";
import { transferSchema, type TransferFormValues, type TransferValues } from "./transferSchema";

function TransferForm({ onDone }: { onDone: () => void }) {
  const { data: wallets = [] } = useWallets();
  const create = useCreateTransfer();
  const active = wallets.filter((w) => !w.is_archived);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues, unknown, TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_wallet_id: active[0]?.id ?? "",
      to_wallet_id: active[1]?.id ?? "",
      amount: "",
      occurred_at: nowForInput(),
      note: "",
    },
  });

  // Dompet bisa tiba setelah form tampil: isi pilihan awal (asal = pertama, tujuan = kedua) bila masih kosong.
  const firstId = active[0]?.id;
  const secondId = active[1]?.id;
  useEffect(() => {
    if (firstId && !getValues("from_wallet_id")) setValue("from_wallet_id", firstId);
    if (secondId && !getValues("to_wallet_id")) setValue("to_wallet_id", secondId);
  }, [firstId, secondId, getValues, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      onDone();
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  const walletOptions = active.map((w) => (
    <option key={w.id} value={w.id}>
      {w.name}
    </option>
  ));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {active.length < 2 && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">Kamu butuh minimal dua dompet aktif untuk transfer.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="tf-from" label="Dari dompet" error={errors.from_wallet_id}>
          <select id="tf-from" aria-invalid={errors.from_wallet_id ? true : undefined} className={inputClass} {...register("from_wallet_id")}>
            {walletOptions}
          </select>
        </FormField>
        <FormField id="tf-to" label="Ke dompet" error={errors.to_wallet_id}>
          <select id="tf-to" aria-invalid={errors.to_wallet_id ? true : undefined} className={inputClass} {...register("to_wallet_id")}>
            {walletOptions}
          </select>
        </FormField>
      </div>

      <FormField id="tf-amount" label="Jumlah (Rp)" error={errors.amount}>
        <input id="tf-amount" inputMode="numeric" placeholder="0" aria-invalid={errors.amount ? true : undefined} className={inputClass} {...register("amount")} />
      </FormField>

      <FormField id="tf-time" label="Waktu (WIB)" error={errors.occurred_at}>
        <input id="tf-time" type="datetime-local" aria-invalid={errors.occurred_at ? true : undefined} className={inputClass} {...register("occurred_at")} />
      </FormField>

      <FormField id="tf-note" label="Catatan (opsional)" error={errors.note}>
        <input id="tf-note" maxLength={255} className={inputClass} {...register("note")} />
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
          {isSubmitting ? "Memproses..." : "Transfer"}
        </Button>
      </div>
    </form>
  );
}

export function TransferDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Transfer antar dompet">
      <TransferForm onDone={onClose} />
    </Dialog>
  );
}
