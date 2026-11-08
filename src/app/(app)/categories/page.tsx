"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import type { Category } from "@/features/categories/api";
import { CategoryForm } from "@/features/categories/CategoryForm";
import { CategoryList } from "@/features/categories/CategoryList";

export default function CategoriesPage() {
  // undefined = tertutup, null = tambah, Category = ubah
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const close = () => setEditing(undefined);

  return (
    <>
      <PageHeader
        title="Kategori"
        description="Kelompokkan pemasukan dan pengeluaran. Subkategori maksimal satu tingkat."
        action={<Button onClick={() => setEditing(null)}>Tambah kategori</Button>}
      />
      <CategoryList onEdit={setEditing} />
      <Dialog open={editing !== undefined} onClose={close} title={editing ? "Ubah kategori" : "Tambah kategori"}>
        <CategoryForm category={editing ?? undefined} onDone={close} />
      </Dialog>
    </>
  );
}
