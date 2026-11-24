"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { useWallets } from "@/features/wallets/api";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { formatNumber } from "@/lib/format";
import { useCreateGoal, useGoals, useUpdateGoal, type Goal } from "./api";
import { makeGoalSchema, type GoalFormInput, type GoalValues } from "./schema";

type Props = { goal?: Goal; onDone: () => void };

export function GoalForm({ goal, onDone }: Props) {
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const wallets = useWallets();
  const goals = useGoals();
  const schema = useMemo(() => makeGoalSchema(goal?.deadline ?? null), [goal?.deadline]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GoalFormInput, unknown, GoalValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: goal?.name ?? "",
      wallet_id: goal?.wallet_id ?? "",
      target_amount: goal ? formatNumber(goal.target_amount) : "",
      deadline: goal?.deadline ?? "",
    },
  });

  // Hanya dompet aktif tanpa target; dompet milik target yang sedang diubah tetap ditawarkan.
  const taken = new Set((goals.data ?? []).map((g) => g.wallet_id));
  const walletOptions = (wallets.data ?? []).filter(
    (w) => w.id === goal?.wallet_id || (!w.is_archived && !taken.has(w.id)),
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (goal) await update.mutateAsync({ id: goal.id, ...values });
      else await create.mutateAsync(values);
      onDone();
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="goal-name" label="Nama target" error={errors.name}>
        <input id="goal-name" maxLength={100} aria-invalid={errors.name ? true : undefined} className={inputClass} {...register("name")} />
      </FormField>

      <FormField id="goal-wallet" label="Dompet" error={errors.wallet_id} hint="Progres dihitung dari saldo dompet ini.">
        <select
          key={`${wallets.isSuccess}-${goals.isSuccess}`}
          id="goal-wallet"
          aria-invalid={errors.wallet_id ? true : undefined}
          className={inputClass}
          {...register("wallet_id")}
        >
          <option value="">Pilih dompet</option>
          {walletOptions.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField id="goal-amount" label="Nominal target (Rp)" error={errors.target_amount}>
        <input id="goal-amount" inputMode="numeric" placeholder="10.000.000" aria-invalid={errors.target_amount ? true : undefined} className={inputClass} {...register("target_amount")} />
      </FormField>

      <FormField id="goal-deadline" label="Tenggat (opsional)" error={errors.deadline} hint="Kosongkan bila tidak ada tenggat.">
        <input id="goal-deadline" type="date" aria-invalid={errors.deadline ? true : undefined} className={inputClass} {...register("deadline")} />
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
