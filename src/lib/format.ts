const TIMEZONE = 'Asia/Jakarta';
const number = new Intl.NumberFormat('id-ID');

/** 1500000 → "Rp 1.500.000"; negatif → "-Rp 25.000". */
export function formatRupiah(amount: number): string {
  return `${amount < 0 ? '-' : ''}Rp ${number.format(Math.abs(amount))}`;
}

/**
 * "1.500.000" / "1500000" / "Rp 25.000" → angka. Selain itu (kosong, huruf, koma desimal,
 * pemisah ribuan yang salah, di atas bilangan bulat aman JavaScript) → null.
 */
export function parseRupiah(input: string): number | null {
  const s = input.trim().replace(/^Rp\s*/i, '');
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(s)) return null;

  const n = Number(s.replace(/\./g, ''));
  return Number.isSafeInteger(n) ? n : null;
}

/** Waktu ISO (UTC) → tanggal di zona Asia/Jakarta, mis. "7 Nov 2026". */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TIMEZONE,
  }).format(new Date(iso));
}

/** Bulan berjalan `YYYY-MM` menurut Asia/Jakarta. */
export function currentMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: TIMEZONE }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;

  return `${get('year')}-${get('month')}`;
}

/** 1500000 → "1.500.000" (tanpa "Rp"), untuk mengisi kolom input uang. */
export function formatNumber(amount: number): string {
  return number.format(amount);
}

// Waktu input (`<input type="datetime-local">`) diperlakukan sebagai jam dinding Asia/Jakarta (WIB, UTC+7 tetap, tanpa DST).
const inputFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Waktu ISO → nilai `datetime-local` (jam dinding Jakarta), mis. "2026-12-01T03:00". */
export function toInputValue(iso: string): string {
  const parts = inputFormat.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** Nilai `datetime-local` (jam Jakarta) → ISO dengan offset, mis. "2026-12-01T03:00:00+07:00". */
export function fromInputValue(local: string): string {
  return `${local}:00+07:00`;
}

/** Nilai awal kolom waktu: sekarang, jam Jakarta. */
export function nowForInput(now: Date = new Date()): string {
  return toInputValue(now.toISOString());
}

/** Geser bulan `YYYY-MM` sebanyak `delta` bulan (boleh negatif), melewati batas tahun. */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const index = year * 12 + (m - 1) + delta;

  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/** "2026-11" → "November 2026". */
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
}

/** `count` bulan `YYYY-MM` terakhir, urut naik, berakhir di bulan berjalan Jakarta. */
export function lastMonths(count: number, now: Date = new Date()): string[] {
  const current = currentMonth(now);

  return Array.from({ length: count }, (_, i) => shiftMonth(current, i - (count - 1)));
}

/** Hari pertama dan terakhir bulan `YYYY-MM` sebagai tanggal `YYYY-MM-DD`. */
export function monthRange(month: string): { from: string; to: string } {
  const [year, m] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();

  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
}
