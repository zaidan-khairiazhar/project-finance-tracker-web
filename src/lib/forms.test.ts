import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';
import { applyServerErrors } from './forms';

describe('applyServerErrors', () => {
  it('maps a 422 ApiError onto form fields', () => {
    const setError = vi.fn();
    const err = Object.assign(new ApiError('x'), {
      status: 422,
      errors: { amount: ['Wajib bilangan bulat.', 'Kedua.'] },
    });

    expect(applyServerErrors(err, setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith('amount', { message: 'Wajib bilangan bulat.' });
  });

  it('ignores other errors', () => {
    const setError = vi.fn();

    expect(applyServerErrors(new Error('x'), setError)).toBe(false);
    expect(applyServerErrors(Object.assign(new ApiError('x'), { status: 500 }), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
