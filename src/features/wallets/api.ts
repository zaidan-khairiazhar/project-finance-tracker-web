import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateKeys } from "@/lib/invalidate";
import type { WalletType, WalletValues } from "./schema";

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  initial_balance: number;
  currency: string;
  is_archived: boolean;
  balance: number;
};

const KEY = ["wallets"];

export function useWallets() {
  return useQuery({ queryKey: KEY, queryFn: async () => (await api<{ data: Wallet[] }>("wallets")).data });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  // Saldo awal dan arsip dompet mengubah total saldo dashboard dan laporan dompet.
  return () => invalidateKeys(queryClient, ["wallets", "dashboard", "reports"]);
}

export function useCreateWallet() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: WalletValues) => api<{ data: Wallet }>("wallets", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: invalidate,
  });
}

export function useUpdateWallet() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<WalletValues & { is_archived: boolean }>) =>
      api<{ data: Wallet }>(`wallets/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: invalidate,
  });
}

/** Server yang memutuskan: dompet bertransaksi diarsipkan (200 + data), yang kosong dihapus (204). */
export function useDeleteWallet() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<{ data: Wallet } | undefined>(`wallets/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
