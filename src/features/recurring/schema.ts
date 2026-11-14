import { z } from "zod";
import { parseRupiah } from "@/lib/format";

const TIMEZONE = "Asia/Jakarta";
const MAX_BACKFILL_DAYS = 366;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const dayFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TIMEZONE });

/** Hari ini (`YYYY-MM-DD`) menurut Asia/Jakarta. */
export function todayJakarta(now: Date = new Date()): string {
  return dayFormat.format(now);
}

/** Tanggal mulai paling awal yang diterima API: 366 hari sebelum hari ini (Jakarta). */
export function minStartDate(now: Date = new Date()): string {
  const d = new Date(`${todayJakarta(now)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - MAX_BACKFILL_DAYS);
  return d.toISOString().slice(0, 10);
}

const amount = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") {
      ctx.addIssue({ code: "custom", message: "Nominal wajib diisi." });
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
  });

/**
 * `enforceMinStart` dimatikan pada mode ubah: tanggal mulai aturan lama boleh lebih dari 366 hari lalu
 * dan tidak ikut dikirim ke API.
 */
export function createRecurringSchema({ enforceMinStart }: { enforceMinStart: boolean }) {
  return z
    .object({
      type: z.enum(["income", "expense"]),
      wallet_id: z.string().min(1, "Pilih dompet."),
      category_id: z.string().transform((v) => (v === "" ? null : v)),
      amount,
      note: z
        .string()
        .max(255, "Catatan maksimal 255 karakter.")
        .transform((v) => (v.trim() === "" ? null : v.trim())),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      start_date: z.string().regex(DATE, "Tanggal mulai wajib diisi."),
      end_date: z
        .string()
        .transform((v) => (v === "" ? null : v))
        .refine((v) => v === null || DATE.test(v), "Tanggal akhir tidak valid."),
    })
    .superRefine((values, ctx) => {
      if (enforceMinStart && values.start_date < minStartDate()) {
        ctx.addIssue({ code: "custom", path: ["start_date"], message: `Tanggal mulai paling lama ${MAX_BACKFILL_DAYS} hari lalu.` });
      }
      if (values.end_date !== null && values.end_date < values.start_date) {
        ctx.addIssue({ code: "custom", path: ["end_date"], message: "Tanggal akhir tidak boleh sebelum tanggal mulai." });
      }
    });
}

export const recurringSchema = createRecurringSchema({ enforceMinStart: true });
export const recurringEditSchema = createRecurringSchema({ enforceMinStart: false });

export type RecurringFormInput = z.input<typeof recurringSchema>;
export type RecurringValues = z.output<typeof recurringSchema>;
