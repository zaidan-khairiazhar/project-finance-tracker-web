import { formatMonth, formatRupiah } from "@/lib/format";
import type { TrendPoint } from "./api";

// Palet kategorikal yang sudah divalidasi (scripts/validate_palette.js, terang dan gelap): biru + oranye.
const CHART_VARS = {
  "--series-income": "#2a78d6",
  "--series-expense": "#eb6834",
} as React.CSSProperties;

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 30, left: 8 };
const PLOT_H = H - PAD.top - PAD.bottom;

const shortMonth = (month: string) =>
  new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

const netText = (net: number) => (net > 0 ? `Surplus +${formatRupiah(net)}` : net < 0 ? `Defisit ${formatRupiah(net)}` : formatRupiah(0));

/** Batang berkelompok pemasukan vs pengeluaran per bulan, lengkap dengan legenda dan tabel pendamping. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(...data.flatMap((p) => [p.income, p.expense]), 0);
  const slot = (W - PAD.left - PAD.right) / Math.max(data.length, 1);
  const barW = Math.min(slot * 0.34, 28);
  const heightOf = (value: number) => (max === 0 ? 0 : (value / max) * PLOT_H);
  const baseline = PAD.top + PLOT_H;

  return (
    <div style={CHART_VARS} className="dark:[--series-income:#3987e5] dark:[--series-expense:#d95926]">
      <ul aria-label="Legenda" className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {[
          ["Pemasukan", "var(--series-income)"],
          ["Pengeluaran", "var(--series-expense)"],
        ].map(([label, color]) => (
          <li key={label} className="flex items-center gap-2">
            <span aria-hidden className="inline-block size-3 rounded-sm" style={{ background: color }} />
            {label}
          </li>
        ))}
      </ul>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grafik batang pemasukan dan pengeluaran per bulan" className="h-auto w-full">
        <line x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} stroke="var(--border)" />
        {data.map((p, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          const bars = [
            { key: "income", value: p.income, x: cx - barW - 1, fill: "var(--series-income)" },
            { key: "expense", value: p.expense, x: cx + 1, fill: "var(--series-expense)" },
          ];
          return (
            <g key={p.month}>
              {bars.map((b) => {
                const h = heightOf(b.value);
                return (
                  <rect
                    key={b.key}
                    data-testid={`bar-${b.key}-${p.month}`}
                    data-value={b.value}
                    x={b.x}
                    y={baseline - h}
                    width={barW}
                    height={h}
                    rx={3}
                    fill={b.fill}
                  >
                    <title>{`${formatMonth(p.month)}: ${b.key === "income" ? "Pemasukan" : "Pengeluaran"} ${formatRupiah(b.value)}`}</title>
                  </rect>
                );
              })}
              <text x={cx} y={H - 9} textAnchor="middle" fontSize={15} fill="var(--muted-foreground)">
                {shortMonth(p.month)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Tren bulanan pemasukan dan pengeluaran</caption>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">Bulan</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Pemasukan</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Pengeluaran</th>
              <th scope="col" className="py-2 text-right font-medium">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.month} className="border-b border-border/60 last:border-0">
                <th scope="row" className="whitespace-nowrap py-2 pr-3 text-left font-normal">{formatMonth(p.month)}</th>
                <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">{formatRupiah(p.income)}</td>
                <td className="whitespace-nowrap py-2 pr-3 text-right tabular-nums">{formatRupiah(p.expense)}</td>
                <td className="whitespace-nowrap py-2 text-right tabular-nums">{netText(p.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
