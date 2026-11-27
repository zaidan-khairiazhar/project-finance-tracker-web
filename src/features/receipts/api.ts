import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateKeys } from "@/lib/invalidate";

export type ReceiptSuggestion = {
  total: number | null;
  date: string | null;
  merchant: string | null;
  category_id: string | null;
};

function toForm(file: File): FormData {
  const form = new FormData();
  form.append("image", file);
  return form;
}

/** Pindai struk dan minta saran isian transaksi. Content-Type multipart diisi browser. */
export async function scanReceipt(file: File): Promise<ReceiptSuggestion> {
  return (await api<{ data: ReceiptSuggestion }>("receipts/scan", { method: "POST", body: toForm(file) })).data;
}

/** URL gambar struk (lewat proxy, memakai cookie sesi). */
export function receiptUrl(id: string): string {
  return `/api/proxy/transactions/${id}/receipt`;
}

/** Struk hanya mengubah penanda `has_receipt` pada daftar transaksi. */
function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => invalidateKeys(queryClient, ["transactions"]);
}

export function useUploadReceipt() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      api<unknown>(`transactions/${id}/receipt`, { method: "POST", body: toForm(file) }),
    onSuccess: invalidate,
  });
}

export function useDeleteReceipt() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => api<undefined>(`transactions/${id}/receipt`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
