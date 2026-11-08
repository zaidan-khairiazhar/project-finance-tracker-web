import { z } from "zod";
import { amountField, dateTimeField, noteField } from "@/lib/schema-fields";

export const transferSchema = z
  .object({
    from_wallet_id: z.string().min(1, "Pilih dompet asal."),
    to_wallet_id: z.string().min(1, "Pilih dompet tujuan."),
    amount: amountField,
    occurred_at: dateTimeField,
    note: noteField,
  })
  .refine((v) => v.from_wallet_id !== v.to_wallet_id, {
    path: ["to_wallet_id"],
    message: "Dompet tujuan harus berbeda dari dompet asal.",
  });

export type TransferFormValues = z.input<typeof transferSchema>;
export type TransferValues = z.output<typeof transferSchema>;
