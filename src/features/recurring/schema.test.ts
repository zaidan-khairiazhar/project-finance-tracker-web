import { describe, expect, it } from 'vitest';
import { minStartDate, recurringSchema, todayJakarta } from './schema';

const today = todayJakarta();
const shift = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const valid = { type: 'expense', wallet_id: 'w1', category_id: 'c1', amount: '50.000', note: '', frequency: 'monthly', start_date: today, end_date: '' };
const parse = (over: object = {}) => recurringSchema.safeParse({ ...valid, ...over });
const message = (over: object) => parse(over).error?.issues[0]?.message ?? null;

describe('recurringSchema', () => {
  it('parses a valid rule into API-ready values', () => {
    expect(parse().data).toEqual({ type: 'expense', wallet_id: 'w1', category_id: 'c1', amount: 50000, note: null, frequency: 'monthly', start_date: today, end_date: null });
  });

  it('rejects an amount of 0 or less than 1', () => {
    expect(message({ amount: '0' })).toBe('Jumlah harus lebih dari 0.');
    expect(parse({ amount: '' }).success).toBe(false);
  });

  it('rejects decimals and amounts above the safe integer limit', () => {
    expect(parse({ amount: '1,5' }).success).toBe(false);
    expect(parse({ amount: '1.5' }).success).toBe(false);
    expect(parse({ amount: '9007199254740991' }).data?.amount).toBe(9007199254740991);
    expect(parse({ amount: '9007199254740992' }).success).toBe(false);
  });

  it('rejects an end date before the start date', () => {
    expect(message({ end_date: shift(today, -1) })).toBe('Tanggal akhir tidak boleh sebelum tanggal mulai.');
    expect(parse({ end_date: today }).success).toBe(true);
  });

  it('limits the start date to 366 days back', () => {
    expect(minStartDate()).toBe(shift(today, -366));
    expect(parse({ start_date: shift(today, -366) }).success).toBe(true);
    expect(message({ start_date: shift(today, -367) })).toBe('Tanggal mulai paling lama 366 hari lalu.');
  });

  it('requires a wallet and rejects notes over 255 characters', () => {
    expect(message({ wallet_id: '' })).toBe('Pilih dompet.');
    expect(parse({ note: 'x'.repeat(256) }).success).toBe(false);
  });
});
