import { describe, expect, it } from 'vitest';
import { describeSchedule, pausedReasonText } from './schedule';

describe('describeSchedule', () => {
  it('describes a monthly rule by day of month', () => {
    expect(describeSchedule({ frequency: 'monthly', start_date: '2026-11-25', end_date: null })).toBe('Setiap bulan tanggal 25');
  });

  it('describes a weekly rule by weekday of the start date', () => {
    expect(describeSchedule({ frequency: 'weekly', start_date: '2026-11-02', end_date: null })).toBe('Setiap Senin');
  });

  it('describes a daily rule', () => {
    expect(describeSchedule({ frequency: 'daily', start_date: '2026-11-02', end_date: null })).toBe('Setiap hari');
  });

  it('appends the end date without timezone shift', () => {
    expect(describeSchedule({ frequency: 'daily', start_date: '2026-11-02', end_date: '2026-12-31' })).toBe('Setiap hari, sampai 31 Des 2026');
  });
});

describe('pausedReasonText', () => {
  it.each([
    ['wallet_archived', 'Dompet diarsipkan'],
    ['wallet_deleted', 'Dompet dihapus'],
    ['category_invalid', 'Kategori tidak valid'],
    [null, ''],
  ])('maps %s', (reason, text) => {
    expect(pausedReasonText(reason)).toBe(text);
  });
});
