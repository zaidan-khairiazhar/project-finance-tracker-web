"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useCategories, useDeleteCategory, type Category } from "./api";
import { categoryTypeLabels, categoryTypes } from "./schema";

const messageOf = (error: unknown) =>
  error instanceof ApiError
    ? (error.errors ? Object.values(error.errors)[0]?.[0] : undefined) ?? error.message
    : "Terjadi kesalahan. Coba lagi.";

const byName = (a: Category, b: Category) => a.name.localeCompare(b.name, "id");

/** Urutan tampil: induk (A-Z), masing-masing diikuti anaknya (A-Z). Anak tanpa induk di daftar dianggap induk. */
function arrange(items: Category[]): { category: Category; depth: 0 | 1 }[] {
  const ids = new Set(items.map((c) => c.id));
  const roots = items.filter((c) => !c.parent_id || !ids.has(c.parent_id)).sort(byName);

  return roots.flatMap((root) => [
    { category: root, depth: 0 as const },
    ...items
      .filter((c) => c.parent_id === root.id)
      .sort(byName)
      .map((category) => ({ category, depth: 1 as const })),
  ]);
}

export function CategoryList({ onEdit }: { onEdit: (category: Category) => void }) {
  const { data, isPending, error, refetch } = useCategories();
  const remove = useDeleteCategory();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) {
    return (
      <div role="status" aria-label="Memuat kategori" className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/40 p-4 text-sm">
        <p className="text-destructive">{messageOf(error)}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title="Belum ada kategori" description="Tambahkan kategori untuk mengelompokkan pemasukan dan pengeluaranmu." />;
  }

  const onDelete = async (c: Category) => {
    if (!confirm(`Hapus kategori "${c.name}"?`)) return;
    setActionError(null);
    try {
      await remove.mutateAsync(c.id);
    } catch (e) {
      setActionError(messageOf(e));
    }
  };

  return (
    <div className="space-y-8">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {categoryTypes.map((type) => {
        const rows = arrange(data.filter((c) => c.type === type));

        return (
          <section key={type} aria-label={categoryTypeLabels[type]}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{categoryTypeLabels[type]}</h2>
            {rows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Belum ada kategori {categoryTypeLabels[type].toLowerCase()}.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {rows.map(({ category: c, depth }) => (
                  <li key={c.id} data-depth={depth} className="flex items-center gap-3 px-4 py-2.5" style={{ paddingLeft: depth ? "2.5rem" : undefined }}>
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm"
                      style={c.color ? { backgroundColor: c.color, color: "#fff" } : undefined}
                    >
                      {c.icon || c.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                    <Button variant="ghost" size="sm" aria-label={`Ubah ${c.name}`} onClick={() => onEdit(c)}>
                      Ubah
                    </Button>
                    <Button variant="destructive" size="sm" aria-label={`Hapus ${c.name}`} disabled={remove.isPending} onClick={() => onDelete(c)}>
                      Hapus
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
