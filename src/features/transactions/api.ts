import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateKeys } from "@/lib/invalidate";
import { api, ApiError } from "@/lib/api";
import { filenameFromDisposition } from "@/lib/download";
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
  per_page?: number;
};

type Page = { data: Transaction[]; meta: { next_cursor: string | null } };

function toQuery(filters: TransactionFilters, cursor?: string): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, String(value));
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

/** Transaksi mengubah saldo dompet, dashboard, progres anggaran, dan laporan, jadi semuanya disegarkan. */
function useInvalidateMoney() {
  const queryClient = useQueryClient();
  return () => invalidateKeys(queryClient, ["transactions", "wallets", "dashboard", "budgets", "reports"]);
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

/** Unduh transaksi sesuai filter sebagai CSV (tanpa paginasi). Melempar ApiError jika ditolak server. */
export async function exportTransactions(filters: TransactionFilters): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`/api/proxy/transactions/export${toQuery({ ...filters, per_page: undefined })}`, { headers: { Accept: "text/csv" } });

  if (!res.ok) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (res.status === 401 && typeof location !== "undefined" && location.pathname !== "/login") location.assign("/login");
    const body = await res.json().catch(() => undefined);
    throw new ApiError(body?.message ?? "Gagal mengekspor. Coba lagi.", res.status, body?.errors);
  }

  return { blob: await res.blob(), filename: filenameFromDisposition(res.headers.get("content-disposition")) ?? "transaksi.csv" };
}
