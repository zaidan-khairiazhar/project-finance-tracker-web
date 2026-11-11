import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TrendPoint = { month: string; income: number; expense: number; net: number };
export type TrendMonths = 6 | 12;

// Kunci diawali "reports" supaya useInvalidateMoney() menyegarkannya saat transaksi berubah.
export function useMonthlyTrend(months: TrendMonths) {
  return useQuery({
    queryKey: ["reports", "monthly-trend", months],
    queryFn: async () => (await api<{ data: TrendPoint[] }>(`reports/monthly-trend?months=${months}`)).data,
  });
}

export type CategoryComparisonType = "expense" | "income";
export type CategoryComparisonRow = { category_id: string | null; name: string; totals: number[]; total: number };
export type CategoryComparison = { months: string[]; rows: CategoryComparisonRow[] };

export function useCategoryComparison(months: number, type: CategoryComparisonType) {
  return useQuery({
    queryKey: ["reports", "category-comparison", months, type],
    queryFn: async () => (await api<{ data: CategoryComparison }>(`reports/category-comparison?months=${months}&type=${type}`)).data,
  });
}

export type DateRange = { from: string; to: string };
export type WalletReportRow = {
  wallet_id: string;
  name: string;
  is_archived: boolean;
  income: number;
  expense: number;
  transfer_in: number;
  transfer_out: number;
  closing_balance: number;
};

export function useWalletReport({ from, to }: DateRange) {
  return useQuery({
    queryKey: ["reports", "wallets", from, to],
    queryFn: async () => (await api<{ data: WalletReportRow[] }>(`reports/wallets?from=${from}&to=${to}`)).data,
  });
}
