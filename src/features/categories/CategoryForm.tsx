"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, inputClass } from "@/components/ui/form";
import { ApiError } from "@/lib/api";
import { applyServerErrors } from "@/lib/forms";
import { useCategories, useCreateCategory, useUpdateCategory, type Category } from "./api";
import { categorySchema, categoryTypeLabels, categoryTypes, type CategoryFormInput, type CategoryValues } from "./schema";

type Props = { category?: Category; onDone: () => void };

export function CategoryForm({ category, onDone }: Props) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const { data: all = [] } = useCategories();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormInput, unknown, CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? "expense",
      icon: category?.icon ?? "",
      color: category?.color ?? "",
      parent_id: category?.parent_id ?? "",
    },
  });

  const type = useWatch({ control, name: "type" });
  const hasChildren = !!category && all.some((c) => c.parent_id === category.id);
  // Induk harus kategori akar, bertipe sama, dan bukan kategori ini sendiri.
  const parents = all.filter((c) => !c.parent_id && c.type === type && c.id !== category?.id);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (category) {
        // Tipe tidak bisa diubah, jadi tidak dikirim.
        await update.mutateAsync({ id: category.id, name: values.name, icon: values.icon, color: values.color, parent_id: values.parent_id });
      } else {
        await create.mutateAsync(values);
      }
      onDone();
    } catch (error) {
      if (applyServerErrors(error, setError)) return;
      setError("root", { message: error instanceof ApiError ? error.message : "Terjadi kesalahan. Coba lagi." });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="category-name" label="Nama kategori" error={errors.name}>
        <input id="category-name" placeholder="mis. Makanan & Minuman" aria-invalid={errors.name ? true : undefined} className={inputClass} {...register("name")} />
      </FormField>

      <FormField id="category-type" label="Tipe" error={errors.type} hint={category ? "Tipe tidak bisa diubah setelah dibuat." : undefined}>
        <select
          id="category-type"
          disabled={!!category}
          className={inputClass}
          {...register("type", { onChange: () => setValue("parent_id", "") })}
        >
          {categoryTypes.map((t) => (
            <option key={t} value={t}>
              {categoryTypeLabels[t]}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        id="category-parent"
        label="Induk (opsional)"
        error={errors.parent_id}
        hint={hasChildren ? "Kategori yang punya subkategori tidak bisa dijadikan subkategori." : "Subkategori hanya bisa satu tingkat."}
      >
        <select id="category-parent" disabled={hasChildren} className={inputClass} {...register("parent_id")}>
          <option value="">Tanpa induk</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField id="category-icon" label="Ikon (opsional)" error={errors.icon} hint="Emoji atau teks singkat.">
          <input id="category-icon" placeholder="🍔" className={inputClass} {...register("icon")} />
        </FormField>
        <FormField id="category-color" label="Warna (opsional)" error={errors.color} hint="Format #RRGGBB.">
          <input id="category-color" placeholder="#0F766E" aria-invalid={errors.color ? true : undefined} className={inputClass} {...register("color")} />
        </FormField>
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
