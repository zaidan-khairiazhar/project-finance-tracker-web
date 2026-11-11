import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { invalidateKeys } from "@/lib/invalidate";
import type { CategoryType, CategoryValues } from "./schema";

export type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
};

const KEY = ["categories"];

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: [...KEY, type ?? "all"],
    queryFn: async () => (await api<{ data: Category[] }>(`categories${type ? `?type=${type}` : ""}`)).data,
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  // Prefiks ["categories"] mengenai semua varian (semua / income / expense). Nama dan penghapusan
  // kategori juga tampil di anggaran dan laporan.
  return () => invalidateKeys(queryClient, ["categories", "budgets", "reports"]);
}

export function useCreateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (values: CategoryValues) =>
      api<{ data: Category }>("categories", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: invalidate,
  });
}

/** Tipe kategori tidak bisa diubah (API mengabaikannya), jadi tidak ikut dikirim. */
export function useUpdateCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Omit<CategoryValues, "type">>) =>
      api<{ data: Category }>(`categories/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`categories/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}
