import { describe, expect, it } from 'vitest';
import { todayJakarta } from '../recurring/schema';
import { makeGoalSchema } from './schema';

const today = todayJakarta();
const shift = (date: string, days: number) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const valid = { name: 'Dana darurat', wallet_id: 'w1', target_amount: '10.000.000', deadline: '' };
const parse = (over: object = {}, initial: string | null = null) => makeGoalSchema(initial).safeParse({ ...valid, ...over });

describe('makeGoalSchema', () => {
  it('parses a valid goal into API-ready values', () => {
    expect(parse().data).toEqual({ name: 'Dana darurat', wallet_id: 'w1', target_amount: 10000000, deadline: null });
    expect(parse({ deadline: today }).data?.deadline).toBe(today);
  });

  it('trims the name and enforces 1..100 characters', () => {
    expect(parse({ name: '  Liburan  ' }).data?.name).toBe('Liburan');
    expect(parse({ name: '   ' }).success).toBe(false);
    expect(parse({ name: 'a'.repeat(100) }).success).toBe(true);
    expect(parse({ name: 'a'.repeat(101) }).success).toBe(false);
  });

  it('requires a wallet', () => {
    expect(parse({ wallet_id: '' }).success).toBe(false);
  });

  it('rejects zero, decimals and amounts above the safe integer limit', () => {
    expect(parse({ target_amount: '0' }).success).toBe(false);
    expect(parse({ target_amount: '' }).success).toBe(false);
    expect(parse({ target_amount: '1,5' }).success).toBe(false);
    expect(parse({ target_amount: '9007199254740992' }).success).toBe(false);
    expect(parse({ target_amount: '9007199254740991' }).data?.target_amount).toBe(9007199254740991);
  });

  it('rejects a deadline before today', () => {
    expect(parse({ deadline: shift(today, -1) }).success).toBe(false);
    expect(parse({ deadline: shift(today, 1) }).success).toBe(true);
  });

  it('accepts a past deadline only when it equals the initial deadline', () => {
    const past = shift(today, -10);
    expect(parse({ deadline: past }, past).success).toBe(true);
    expect(parse({ deadline: shift(past, 1) }, past).success).toBe(false);
  });
});
