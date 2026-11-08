export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status = 0, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type ErrorBody = { message?: string; errors?: Record<string, string[]> };

/** Parse badan respons JSON; kosong atau bukan JSON → undefined. */
async function readJson(res: Response): Promise<ErrorBody | undefined> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Panggil API lewat proxy `/api/proxy/*` (token ada di cookie httpOnly, tidak terlihat di sini). */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(`/api/proxy/${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await readJson(res);

  if (!res.ok) {
    if (res.status === 401 && typeof location !== 'undefined' && location.pathname !== '/login') {
      // Muat ulang penuh (bukan router.push) supaya cache klien ikut dibuang.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      location.assign('/login');
    }
    throw new ApiError(body?.message ?? 'Terjadi kesalahan. Coba lagi.', res.status, body?.errors);
  }

  return body as T;
}

/** Untuk route handler sesi (`/api/session*`), bukan proxy. Melempar ApiError seperti `api()`. */
export async function sessionRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/session${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });
  if (res.status === 204) return undefined as T;

  const body = await readJson(res);
  if (!res.ok) throw new ApiError(body?.message ?? 'Terjadi kesalahan. Coba lagi.', res.status, body?.errors);

  return body as T;
}
