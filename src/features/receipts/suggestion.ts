import type { TransactionFormValues } from "@/features/transactions/schema";
import { nowForInput } from "@/lib/format";
import type { ReceiptSuggestion } from "./api";

/**
 * Ubah saran hasil scan struk menjadi nilai awal form transaksi. `today` adalah tanggal Jakarta
 * (`YYYY-MM-DD`); tanggal struk selain hari ini diberi pukul 12:00 karena jamnya tidak diketahui.
 */
export function suggestionToFormValues(s: ReceiptSuggestion | null, today: string): Partial<TransactionFormValues> {
  const occurred_at = s?.date && s.date !== today ? `${s.date}T12:00` : nowForInput();
  return {
    type: "expense",
    amount: s?.total ?? "",
    category_id: s?.category_id ?? "",
    note: s?.merchant ?? "",
    occurred_at,
  };
}
