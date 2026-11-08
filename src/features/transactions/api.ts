import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TransactionValues } from "./schema";

export type TransactionType = "income" | "expense" | "transfer_out" | "transfer_in";

export type Transaction = {
  id: string;
  wallet_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  occurred_at: string;
  note: string | null;
  transfer_group_id: string | null;
};

export type TransactionFilters = {
  wallet_id?: string;
  category_id?: string;
  type?: TransactionType;
  from?: string;
  to?: string;
  q?: string;
};

type Page = { data: Transaction[]; meta: { next_cursor: string | null } };

function toQuery(filters: TransactionFilters, cursor?: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (cursor) params.set("cursor", cursor);

  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Daftar transaksi dengan paginasi cursor; `fetchNextPage()` memuat halaman berikutnya. */
export function useTransactions(filters: TransactionFilters) {
  return useInfiniteQuery({
    queryKey: ["transactions", filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api<Page>(`transactions${toQuery(filters, pageParam)}`),
    getNextPageParam: (last) => last.meta.next_cursor ?? undefined,
  });
}

/** Transaksi mengubah saldo dompet dan angka dashboard, jadi ketiganya disegarkan. */
function useInvalidateMoney() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(["transactions", "wallets", "dashboard"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

export function useCreateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (values: TransactionValues) =>
      api<{ data: Transaction }>("transactions", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<TransactionValues>) =>
      api<{ data: Transaction }>(`transactions/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`transactions/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export type TransferInput = {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  occurred_at: string;
  note: string | null;
};

export function useCreateTransfer() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (values: TransferInput) => api<unknown>("transfers", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: invalidate,
  });
}

/** Menghapus kedua sisi transfer (keluar dan masuk) sekaligus. */
export function useDeleteTransfer() {
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (groupId: string) => api<undefined>(`transfers/${groupId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
