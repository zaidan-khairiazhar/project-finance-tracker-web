import { NextResponse } from 'next/server';
import { apiBaseUrl, authenticate, clearToken, readToken } from '@/lib/session';

export async function POST(request: Request) {
  return authenticate('login', request);
}

export async function DELETE(request: Request) {
  const token = readToken(request);

  if (token) {
    // Cabut token di API; kalau gagal, cookie tetap dihapus.
    await fetch(`${apiBaseUrl()}/auth/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => undefined);
  }

  const res = new NextResponse(null, { status: 204 });
  clearToken(res);

  return res;
}
