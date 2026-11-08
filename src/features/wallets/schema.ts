import { z } from "zod";
import { parseRupiah } from "@/lib/format";

export const walletTypes = ["cash", "bank", "ewallet"] as const;
export type WalletType = (typeof walletTypes)[number];

export const walletTypeLabels: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-wallet",
};

export const walletSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
  type: z.enum(walletTypes, { error: "Pilih tipe dompet." }),
  // Kolom input berupa teks ("1.500.000"); hasilnya angka bulat >= 0. Kosong dianggap 0.
  initial_balance: z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return 0;
      const n = parseRupiah(value);
      if (n === null) {
        ctx.addIssue({ code: "custom", message: "Masukkan angka bulat, mis. 1.500.000." });
        return z.NEVER;
      }
      return n;
    }),
});

export type WalletFormInput = z.input<typeof walletSchema>;
export type WalletValues = z.output<typeof walletSchema>;
