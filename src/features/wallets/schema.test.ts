import { describe, expect, it } from 'vitest';
import { walletSchema } from './schema';

describe('walletSchema', () => {
  it('requires a name and a non-negative integer balance', () => {
    expect(walletSchema.safeParse({ name: '', type: 'cash', initial_balance: '0' }).success).toBe(false);
    expect(walletSchema.safeParse({ name: 'BCA', type: 'bank', initial_balance: '1.500.000' }).data?.initial_balance).toBe(1500000);
    expect(walletSchema.safeParse({ name: 'BCA', type: 'kartu', initial_balance: '0' }).success).toBe(false);
  });

  it('treats an empty balance as 0 and rejects invalid balances', () => {
    expect(walletSchema.safeParse({ name: 'Tunai', type: 'cash', initial_balance: '' }).data?.initial_balance).toBe(0);
    for (const bad of ['abc', '12,5', '-5', '9007199254740993']) {
      expect(walletSchema.safeParse({ name: 'X', type: 'cash', initial_balance: bad }).success).toBe(false);
    }
  });

  it('trims the name and caps it at 100 characters', () => {
    expect(walletSchema.safeParse({ name: '  BCA  ', type: 'bank', initial_balance: '0' }).data?.name).toBe('BCA');
    expect(walletSchema.safeParse({ name: 'x'.repeat(101), type: 'bank', initial_balance: '0' }).success).toBe(false);
  });
});
