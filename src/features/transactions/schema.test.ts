import { describe, expect, it } from 'vitest';
import { transactionSchema } from './schema';

const valid = { type: 'expense', amount: '25.000', wallet_id: 'w1', category_id: '', occurred_at: '2026-11-07T23:30', note: '' };

describe('transactionSchema', () => {
  it('parses amount to an integer, time to +07:00 ISO, and empty optionals to null', () => {
    expect(transactionSchema.safeParse(valid).data).toEqual({
      type: 'expense',
      amount: 25000,
      wallet_id: 'w1',
      category_id: null,
      occurred_at: '2026-11-07T23:30:00+07:00',
      note: null,
    });
  });

  it.each([
    ['', 'Jumlah wajib diisi.'],
    ['0', 'Jumlah harus lebih dari 0.'],
    ['12,5', 'Jumlah harus berupa angka bulat'],
    ['abc', 'Jumlah harus berupa angka bulat'],
  ])('rejects amount %j', (amount, message) => {
    const r = transactionSchema.safeParse({ ...valid, amount });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain(message);
  });

  it('accepts a numeric amount (used for edit defaults)', () => {
    expect(transactionSchema.safeParse({ ...valid, amount: 5 }).data?.amount).toBe(5);
  });

  it('requires a wallet and rejects transfer types', () => {
    expect(transactionSchema.safeParse({ ...valid, wallet_id: '' }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, type: 'transfer_out' }).success).toBe(false);
  });
});
