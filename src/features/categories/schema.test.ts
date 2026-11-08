import { describe, expect, it } from 'vitest';
import { categorySchema } from './schema';

describe('categorySchema', () => {
  it('requires a name and a valid type', () => {
    expect(categorySchema.safeParse({ name: 'Kopi', type: 'expense' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: '', type: 'expense' }).success).toBe(false);
    expect(categorySchema.safeParse({ name: 'Kopi', type: 'transfer_out' }).success).toBe(false);
  });

  it('turns empty optional fields into null', () => {
    const r = categorySchema.safeParse({ name: 'Kopi', type: 'expense', icon: '', color: '', parent_id: '' });
    expect(r.data).toMatchObject({ icon: null, color: null, parent_id: null });
  });

  it('validates the color as #RRGGBB', () => {
    expect(categorySchema.safeParse({ name: 'A', type: 'income', color: '#A1B2C3' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: 'A', type: 'income', color: 'merah' }).success).toBe(false);
  });
});
