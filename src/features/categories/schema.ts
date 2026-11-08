import { z } from "zod";

export const categoryTypes = ["expense", "income"] as const;
export type CategoryType = (typeof categoryTypes)[number];

export const categoryTypeLabels: Record<CategoryType, string> = {
  expense: "Pengeluaran",
  income: "Pemasukan",
};

// Kolom opsional di form berupa teks; kosong → null (sesuai yang diterima API).
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} maksimal ${max} karakter.`)
    .optional()
    .transform((v) => v || null);

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100, "Nama maksimal 100 karakter."),
  type: z.enum(categoryTypes, { error: "Pilih tipe kategori." }),
  icon: optionalText(50, "Ikon"),
  color: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      if (!/^#[0-9A-Fa-f]{6}$/.test(v)) {
        ctx.addIssue({ code: "custom", message: "Warna harus berformat #RRGGBB, mis. #0F766E." });
        return z.NEVER;
      }
      return v;
    }),
  parent_id: z
    .string()
    .optional()
    .transform((v) => v || null),
});

export type CategoryFormInput = z.input<typeof categorySchema>;
export type CategoryValues = z.output<typeof categorySchema>;
