import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Summary = { month: string; income: number; expense: number; net: number; total_balance: number };
export type CategoryTotal = { category_id: string | null; name: string; color: string | null; total: number };
export type BreakdownType = "expense" | "income";

// Semua kunci diawali "dashboard" supaya useInvalidateMoney() menyegarkannya saat transaksi berubah.
export function useSummary(month: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", month],
    queryFn: async () => (await api<{ data: Summary }>(`dashboard/summary?month=${month}`)).data,
  });
}

export function useCategoryBreakdown(month: string, type: BreakdownType) {
  return useQuery({
    queryKey: ["dashboard", "by-category", month, type],
    queryFn: async () => (await api<{ data: CategoryTotal[] }>(`dashboard/by-category?month=${month}&type=${type}`)).data,
  });
}
