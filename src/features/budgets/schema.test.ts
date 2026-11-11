import { describe, expect, it } from 'vitest';
import { budgetSchema } from './schema';

const parse = (v: object) => budgetSchema.safeParse(v);
const message = (v: object) => (parse(v).error?.issues[0]?.message ?? null);

describe('budgetSchema', () => {
  it('parses a grouped rupiah amount into an integer', () => {
    expect(parse({ category_id: 'c1', amount: '1.500.000' }).data).toEqual({ category_id: 'c1', amount: 1500000 });
  });

  it('requires a category', () => {
    expect(message({ category_id: '', amount: '1000' })).toBe('Pilih kategori.');
  });

  it('requires an amount greater than zero', () => {
    expect(message({ category_id: 'c1', amount: '' })).toBe('Jumlah wajib diisi.');
    expect(message({ category_id: 'c1', amount: '0' })).toBe('Jumlah harus lebih dari 0.');
  });

  it.each(['abc', '12,5', '-5', '9.007.199.254.740.992'])('rejects %s', (amount) => {
    expect(parse({ category_id: 'c1', amount }).success).toBe(false);
  });
});
