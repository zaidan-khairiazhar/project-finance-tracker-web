import { z } from "zod";
import { parseRupiah } from "@/lib/format";

export const budgetSchema = z.object({
  category_id: z.string().min(1, "Pilih kategori."),
  // Kolom input berupa teks ("1.500.000"); hasilnya bilangan bulat aman > 0 (batas yang sama dengan API).
  amount: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") {
        ctx.addIssue({ code: "custom", message: "Jumlah wajib diisi." });
        return z.NEVER;
      }
      const n = parseRupiah(value);
      if (n === null) {
        ctx.addIssue({ code: "custom", message: "Masukkan angka bulat, mis. 1.500.000." });
        return z.NEVER;
      }
      if (n < 1) {
        ctx.addIssue({ code: "custom", message: "Jumlah harus lebih dari 0." });
        return z.NEVER;
      }
      return n;
    }),
});

export type BudgetFormInput = z.input<typeof budgetSchema>;
export type BudgetValues = z.output<typeof budgetSchema>;
