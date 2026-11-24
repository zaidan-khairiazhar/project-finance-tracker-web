import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type GoalStatus = "in_progress" | "reached" | "overdue";
export type GoalWalletStatus = "ok" | "archived" | "deleted";

export type Goal = {
  id: string;
  name: string;
  wallet_id: string;
  wallet_name: string;
  wallet_status: GoalWalletStatus;
  target_amount: number;
  current_amount: number;
  remaining: number;
  percent: number;
  status: GoalStatus;
  deadline: string | null;
  monthly_needed: number | null;
};

export type GoalInput = {
  name: string;
  wallet_id: string;
  target_amount: number;
  deadline: string | null;
};

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => (await api<{ data: Goal[] }>("goals")).data,
  });
}

/** Mutasi target hanya memengaruhi daftar target; progres dihitung server dari saldo dompet. */
function useInvalidateGoals() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["goals"] });
}

export function useCreateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (values: GoalInput) =>
      api<{ data: Goal }>("goals", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: invalidate,
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<GoalInput>) =>
      api<{ data: Goal }>(`goals/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: invalidate,
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`goals/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
