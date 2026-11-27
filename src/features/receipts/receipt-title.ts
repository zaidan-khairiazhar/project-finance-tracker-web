import type { Transaction } from "@/features/transactions/api";

/** Judul struk untuk label aksesibel: catatan transaksi, atau "transaksi" bila kosong. */
export const receiptTitle = (t: Pick<Transaction, "note">) => t.note || "transaksi";
