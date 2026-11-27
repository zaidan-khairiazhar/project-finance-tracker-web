import { describe, expect, it } from 'vitest';
import { nowForInput } from '@/lib/format';
import { suggestionToFormValues } from './suggestion';

const today = '2026-11-26';

describe('suggestionToFormValues', () => {
  it('mengisi semua kolom; tanggal lain menjadi pukul 12:00', () => {
    expect(
      suggestionToFormValues({ total: 45000, date: '2026-11-10', merchant: 'Warung Bu Tini', category_id: 'c1' }, today),
    ).toEqual({ type: 'expense', amount: 45000, category_id: 'c1', note: 'Warung Bu Tini', occurred_at: '2026-11-10T12:00' });
  });

  it('tanggal hari ini memakai waktu sekarang', () => {
    const v = suggestionToFormValues({ total: 1000, date: today, merchant: null, category_id: null }, today);
    expect(v.occurred_at).toHaveLength(16);
    expect(v.occurred_at?.slice(0, 13)).toBe(nowForInput().slice(0, 13));
  });

  it('tanpa tanggal memakai waktu sekarang', () => {
    const v = suggestionToFormValues({ total: null, date: null, merchant: null, category_id: null }, today);
    expect(v.occurred_at).toHaveLength(16);
    expect(v).toMatchObject({ type: 'expense', amount: '', category_id: '', note: '' });
  });

  it('null menghasilkan form kosong bertipe pengeluaran', () => {
    expect(suggestionToFormValues(null, today)).toMatchObject({ type: 'expense', amount: '', category_id: '', note: '' });
  });
});
