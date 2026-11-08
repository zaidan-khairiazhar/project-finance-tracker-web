"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { useCategories } from "@/features/categories/api";
import { useWallets } from "@/features/wallets/api";
import type { TransactionFilters as Filters, TransactionType } from "./api";

const TYPE_OPTIONS: { value: TransactionType | ""; label: string }[] = [
  { value: "", label: "Semua tipe" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
  { value: "transfer_out", label: "Transfer keluar" },
  { value: "transfer_in", label: "Transfer masuk" },
];

type Props = { value: Filters; onChange: (filters: Filters) => void };

export function TransactionFilters({ value, onChange }: Props) {
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();

  // Pencarian ditunda 300 ms supaya tidak memanggil API di setiap ketukan.
  const [query, setQuery] = useState(value.q ?? "");
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      const { value, onChange } = latest.current;
      if ((value.q ?? "") !== query.trim()) onChange({ ...value, q: query.trim() || undefined });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const set = (patch: Partial<Filters>) => {
    const next = { ...value, ...patch };
    // Buang kunci kosong supaya filter yang dikirim bersih.
    onChange(Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as Filters);
  };
  const hasFilter = Object.values(value).some(Boolean) || query !== "";

  return (
    <form role="search" aria-label="Filter transaksi" onSubmit={(e) => e.preventDefault()} className="mb-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
        <label htmlFor="f-q" className="text-xs font-medium text-muted-foreground">Cari catatan</label>
        <input id="f-q" type="search" placeholder="mis. kopi" value={query} onChange={(e) => setQuery(e.target.value)} className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="f-wallet" className="text-xs font-medium text-muted-foreground">Dompet</label>
        <select id="f-wallet" value={value.wallet_id ?? ""} onChange={(e) => set({ wallet_id: e.target.value })} className={inputClass}>
          <option value="">Semua dompet</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="f-category" className="text-xs font-medium text-muted-foreground">Kategori</label>
        <select id="f-category" value={value.category_id ?? ""} onChange={(e) => set({ category_id: e.target.value })} className={inputClass}>
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent_id ? "— " : ""}
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="f-type" className="text-xs font-medium text-muted-foreground">Tipe</label>
        <select id="f-type" value={value.type ?? ""} onChange={(e) => set({ type: e.target.value as TransactionType })} className={inputClass}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="f-from" className="text-xs font-medium text-muted-foreground">Dari tanggal</label>
        <input id="f-from" type="date" value={value.from ?? ""} max={value.to || undefined} onChange={(e) => set({ from: e.target.value })} className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="f-to" className="text-xs font-medium text-muted-foreground">Sampai tanggal</label>
        <input id="f-to" type="date" value={value.to ?? ""} min={value.from || undefined} onChange={(e) => set({ to: e.target.value })} className={inputClass} />
      </div>

      <div className="flex items-end">
        <Button variant="outline" disabled={!hasFilter} onClick={() => { setQuery(""); onChange({}); }}>
          Reset filter
        </Button>
      </div>
    </form>
  );
}
