import { z } from "zod";
import { amount, todayJakarta } from "../recurring/schema";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `initialDeadline` adalah tenggat target yang sedang diubah (null saat membuat). API hanya memeriksa
 * tenggat bila berubah, jadi tenggat lama yang sudah lewat tetap boleh disimpan.
 */
export function makeGoalSchema(initialDeadline: string | null) {
  return z.object({
    name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
    wallet_id: z.string().min(1, "Pilih dompet."),
    target_amount: amount,
    deadline: z
      .string()
      .transform((v) => (v === "" ? null : v))
      .superRefine((v, ctx) => {
        if (v === null || v === initialDeadline) return;
        if (!DATE.test(v)) ctx.addIssue({ code: "custom", message: "Tenggat tidak valid." });
        else if (v < todayJakarta()) ctx.addIssue({ code: "custom", message: "Tenggat tidak boleh sebelum hari ini." });
      }),
  });
}

export type GoalFormInput = z.input<ReturnType<typeof makeGoalSchema>>;
export type GoalValues = z.output<ReturnType<typeof makeGoalSchema>>;
