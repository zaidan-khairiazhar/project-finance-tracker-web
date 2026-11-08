import { z } from "zod";
import { fromInputValue, parseRupiah } from "./format";

/** Jumlah uang dari kolom teks ("1.500.000") atau angka (nilai awal saat edit) → bilangan bulat >= 1. */
export const amountField = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const raw = typeof value === "number" ? String(value) : value.trim();
  if (raw === "") {
    ctx.addIssue({ code: "custom", message: "Jumlah wajib diisi." });
    return z.NEVER;
  }

  const n = parseRupiah(raw);
  if (n === null) {
    ctx.addIssue({ code: "custom", message: "Jumlah harus berupa angka bulat, mis. 1.500.000." });
    return z.NEVER;
  }
  if (n < 1) {
    ctx.addIssue({ code: "custom", message: "Jumlah harus lebih dari 0." });
    return z.NEVER;
  }

  return n;
});

/** Nilai `datetime-local` (jam Jakarta) → ISO ber-offset +07:00. */
export const dateTimeField = z
  .string()
  .min(1, "Waktu wajib diisi.")
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Format waktu tidak valid.")
  .transform(fromInputValue);

/** Catatan opsional; kosong → null (supaya bisa menghapus catatan lewat PATCH). */
export const noteField = z
  .string()
  .trim()
  .max(255, "Catatan maksimal 255 karakter.")
  .optional()
  .transform((v) => v || null);
