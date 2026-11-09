import { describe, expect, it } from 'vitest';
import { currentMonth, formatDate, formatRupiah, formatMonth, fromInputValue, nowForInput, parseRupiah, shiftMonth, toInputValue } from './format';

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

describe('datetime-local helpers (Asia/Jakarta)', () => {
  it('shows a UTC instant as Jakarta wall-clock time', () => {
    expect(toInputValue('2026-11-30T20:00:00Z')).toBe('2026-12-01T03:00');
    expect(toInputValue('2026-11-07T16:30:00Z')).toBe('2026-11-07T23:30');
  });

  it('turns Jakarta wall-clock input into an ISO string with +07:00', () => {
    expect(fromInputValue('2026-12-01T03:00')).toBe('2026-12-01T03:00:00+07:00');
  });

  it('round-trips through the same instant', () => {
    const iso = '2026-11-07T16:30:00Z';
    expect(new Date(fromInputValue(toInputValue(iso))).toISOString()).toBe('2026-11-07T16:30:00.000Z');
  });

  it('gives the current Jakarta time for the input default', () => {
    expect(nowForInput(new Date('2026-11-30T20:00:00Z'))).toBe('2026-12-01T03:00');
  });
});

describe('month helpers', () => {
  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-11', 1)).toBe('2026-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-03', -3)).toBe('2025-12');
  });

  it('formats a month in Indonesian', () => {
    expect(formatMonth('2026-11')).toBe('November 2026');
    expect(formatMonth('2026-12')).toBe('Desember 2026');
    expect(formatMonth('2026-08')).toBe('Agustus 2026');
  });
});
