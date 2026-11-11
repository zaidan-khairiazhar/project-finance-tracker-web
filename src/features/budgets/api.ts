import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateKeys } from "@/lib/invalidate";
import type { BudgetValues } from "./schema";

export type BudgetStatus = "ok" | "warning" | "over";

export type Budget = {
  id: string;
  category_id: string;
  category_name: string;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
};

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: async () => (await api<{ data: Budget[] }>(`budgets?month=${month}`)).data,
  });
}

/** Atur anggaran kategori: dibuat baru atau diperbarui (PUT = upsert per kategori). */
export function useUpsertBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: BudgetValues) =>
      api<{ data: { id: string; category_id: string; amount: number } }>("budgets", { method: "PUT", body: JSON.stringify(values) }),
    onSuccess: () => invalidateKeys(queryClient, ["budgets"]),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateKeys(queryClient, ["budgets"]),
  });
}
