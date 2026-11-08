import { ApiError } from './api';

/**
 * Petakan error validasi 422 dari API ke field React Hook Form.
 * Mengembalikan true jika error-nya memang 422 dan sudah dipetakan.
 */
export function applyServerErrors<F extends string>(
  error: unknown,
  setError: (field: F, o: { message: string }) => void,
): boolean {
  if (!(error instanceof ApiError) || error.status !== 422 || !error.errors) return false;

  for (const [field, messages] of Object.entries(error.errors)) {
    if (messages[0]) setError(field as F, { message: messages[0] });
  }

  return true;
}
