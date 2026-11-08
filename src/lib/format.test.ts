import { describe, expect, it } from 'vitest';
import { currentMonth, formatDate, formatRupiah, parseRupiah } from './format';

describe('format', () => {
  it('formats rupiah with id-ID grouping', () => {
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000');
  });

  it('formats zero and negative amounts', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
    expect(formatRupiah(-25000)).toBe('-Rp 25.000');
  });

  it('parses rupiah input', () => {
    expect(parseRupiah('1.500.000')).toBe(1500000);
    expect(parseRupiah('1500000')).toBe(1500000);
    expect(parseRupiah('Rp 25.000')).toBe(25000);
    expect(parseRupiah('')).toBeNull();
    expect(parseRupiah('abc')).toBeNull();
    expect(parseRupiah('12,5')).toBeNull();
    expect(parseRupiah('1.50')).toBeNull();
  });

  it('rejects numbers above the JavaScript safe integer', () => {
    expect(parseRupiah('9007199254740993')).toBeNull();
  });

  it('formats dates in Asia/Jakarta', () => {
    expect(formatDate('2026-11-30T20:00:00Z')).toBe('1 Des 2026');
    expect(formatDate('2026-11-07T16:30:00Z')).toBe('7 Nov 2026');
  });

  it('returns the Jakarta month', () => {
    expect(currentMonth(new Date('2026-11-30T20:00:00Z'))).toBe('2026-12');
    expect(currentMonth(new Date('2026-11-30T16:59:00Z'))).toBe('2026-11');
  });
});
