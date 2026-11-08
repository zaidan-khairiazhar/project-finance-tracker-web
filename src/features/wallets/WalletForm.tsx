"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { formatNumber } from "@/lib/format";
import { useCreateWallet, useUpdateWallet, type Wallet } from "./api";
import { walletSchema, walletTypeLabels, walletTypes, type WalletFormInput, type WalletValues } from "./schema";

type Props = { wallet?: Wallet; onDone: () => void };

export function WalletForm({ wallet, onDone }: Props) {
  const create = useCreateWallet();
  const update = useUpdateWallet();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WalletFormInput, unknown, WalletValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: wallet?.name ?? "",
      type: wallet?.type ?? "bank",
      initial_balance: wallet ? formatNumber(wallet.initial_balance) : "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (wallet) await update.mutateAsync({ id: wallet.id, ...values });
      else await create.mutateAsync(values);
      onDone();
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="wallet-name" label="Nama dompet" error={errors.name}>
        <input id="wallet-name" placeholder="mis. BCA, Tunai, GoPay" aria-invalid={errors.name ? true : undefined} className={inputClass} {...register("name")} />
      </FormField>

      <FormField id="wallet-type" label="Tipe" error={errors.type}>
        <select id="wallet-type" className={inputClass} {...register("type")}>
          {walletTypes.map((t) => (
            <option key={t} value={t}>
              {walletTypeLabels[t]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="wallet-balance" label="Saldo awal (Rp)" error={errors.initial_balance} hint="Boleh dikosongkan (dianggap 0).">
        <input
          id="wallet-balance"
          inputMode="numeric"
          placeholder="0"
          aria-invalid={errors.initial_balance ? true : undefined}
          className={inputClass}
          {...register("initial_balance")}
        />
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
