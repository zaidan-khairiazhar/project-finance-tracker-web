import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateKeys } from "@/lib/invalidate";

export type RecurringFrequency = "daily" | "weekly" | "monthly";
export type RecurringStatus = "active" | "paused" | "finished";

export type RecurringRule = {
  id: string;
  wallet_id: string;
  wallet_name: string;
  category_id: string | null;
  category_name: string | null;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  is_active: boolean;
  paused_reason: string | null;
  status: RecurringStatus;
};

export type RecurringRuleInput = {
  wallet_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
};

export function useRecurringRules() {
  return useQuery({
    queryKey: ["recurring"],
    queryFn: async () => (await api<{ data: RecurringRule[] }>("recurring-rules")).data,
  });
}

/** Jadwal menghasilkan transaksi, jadi semua yang bergantung pada transaksi ikut disegarkan. */
function useInvalidateRecurring() {
  const queryClient = useQueryClient();
  return () => invalidateKeys(queryClient, ["recurring", "transactions", "wallets", "dashboard", "budgets", "reports"]);
}

export function useCreateRecurringRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (values: RecurringRuleInput) =>
      api<{ data: RecurringRule }>("recurring-rules", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: invalidate,
  });
}

export function useUpdateRecurringRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<RecurringRuleInput> & { is_active?: boolean }) =>
      api<{ data: RecurringRule }>(`recurring-rules/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: invalidate,
  });
}

export function useDeleteRecurringRule() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`recurring-rules/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

/** Menjalankan semua jadwal yang jatuh tempo sekarang; mengembalikan jumlah transaksi yang dibuat. */
export function useRunRecurring() {
  const invalidate = useInvalidateRecurring();
  return useMutation({
    mutationFn: () => api<{ created: number }>("recurring-rules/run", { method: "POST" }),
    onSuccess: invalidate,
  });
}
