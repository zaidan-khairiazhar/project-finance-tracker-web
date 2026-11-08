import { z } from "zod";
import { amountField, dateTimeField, noteField } from "@/lib/schema-fields";

export const transactionTypes = ["expense", "income"] as const;
export type TransactionFormType = (typeof transactionTypes)[number];

export const transactionTypeLabels: Record<TransactionFormType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
};

export const transactionSchema = z.object({
  type: z.enum(transactionTypes, { error: "Pilih tipe transaksi." }),
  amount: amountField,
  wallet_id: z.string().min(1, "Pilih dompet."),
  category_id: z
    .string()
    .optional()
    .transform((v) => v || null),
  occurred_at: dateTimeField,
  note: noteField,
});

export type TransactionFormValues = z.input<typeof transactionSchema>;
export type TransactionValues = z.output<typeof transactionSchema>;
