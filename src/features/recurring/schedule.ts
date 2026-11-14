import type { RecurringRule } from "./api";

const dateFormat = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "UTC" });

// Tanggal tanpa jam diparse sebagai UTC agar tidak bergeser oleh zona waktu perangkat.
const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/** Ringkasan jadwal berulang dalam bahasa Indonesia, mis. "Setiap bulan tanggal 25, sampai 31 Des 2026". */
export function describeSchedule(rule: Pick<RecurringRule, "frequency" | "start_date" | "end_date">): string {
  const base =
    rule.frequency === "daily"
      ? "Setiap hari"
      : rule.frequency === "weekly"
        ? `Setiap ${weekdayFormat.format(utc(rule.start_date))}`
        : `Setiap bulan tanggal ${Number(rule.start_date.slice(8, 10))}`;

  return rule.end_date ? `${base}, sampai ${dateFormat.format(utc(rule.end_date))}` : base;
}

const PAUSED_REASONS: Record<string, string> = {
  wallet_archived: "Dompet diarsipkan",
  wallet_deleted: "Dompet dihapus",
  category_invalid: "Kategori tidak valid",
};

export function pausedReasonText(reason: string | null): string {
  return reason ? (PAUSED_REASONS[reason] ?? "") : "";
}
