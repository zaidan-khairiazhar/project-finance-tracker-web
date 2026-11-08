import { NextResponse } from 'next/server';

export const TOKEN_COOKIE = 'token';

export const apiBaseUrl = () => process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1';

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  // Dev memakai http://localhost, jadi Secure hanya di production.
  secure: process.env.NODE_ENV === 'production',
});

export function setToken(res: NextResponse, token: string): void {
  res.cookies.set(TOKEN_COOKIE, token, { ...cookieOptions(), maxAge: 60 * 60 * 24 * 30 });
}

export function clearToken(res: NextResponse): void {
  res.cookies.set(TOKEN_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
}

export function readToken(request: Request): string | undefined {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${TOKEN_COOKIE}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

/** Login/registrasi: teruskan ke API, simpan token di cookie, kembalikan hanya `{ user }`. */
export async function authenticate(path: 'login' | 'register', request: Request): Promise<NextResponse> {
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl()}/auth/${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: await request.text(),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Server tidak dapat dihubungi. Coba lagi nanti.' }, { status: 502 });
  }

  const text = await upstream.text();
  let body: { data?: { token?: string; user?: unknown } } & { message?: string } | undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = undefined;
  }

  if (!upstream.ok || !body?.data?.token) {
    return NextResponse.json(body ?? { message: 'Terjadi kesalahan. Coba lagi.' }, {
      status: upstream.ok ? 502 : upstream.status,
    });
  }

  const res = NextResponse.json({ user: body.data.user }, { status: upstream.status });
  setToken(res, body.data.token);

  return res;
}
