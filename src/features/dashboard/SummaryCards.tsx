import { formatRupiah } from "@/lib/format";
import type { Summary } from "./api";

export function SummaryCards({ data }: { data: Summary }) {
  const items = [
    { label: "Total saldo", value: data.total_balance, tone: "" },
    { label: "Pemasukan", value: data.income, tone: "text-income" },
    { label: "Pengeluaran", value: data.expense, tone: "text-expense" },
    { label: "Selisih", value: data.net, tone: "" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-card p-4">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className={`mt-1 text-lg font-semibold tabular-nums sm:text-xl ${item.tone}`}>{formatRupiah(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
