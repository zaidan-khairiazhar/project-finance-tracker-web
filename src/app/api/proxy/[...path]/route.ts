import { NextResponse } from 'next/server';
import { apiBaseUrl, clearToken, readToken } from '@/lib/session';

type Context = { params: Promise<{ path: string[] }> };

/**
 * Satu route handler untuk semua panggilan API dari browser. Token dibaca dari cookie httpOnly
 * dan dipasang sebagai header Authorization, jadi tidak pernah terlihat oleh JavaScript browser.
 */
async function handler(request: Request, { params }: Context): Promise<NextResponse> {
  const { path } = await params;

  // Cegah keluar dari /api/v1 lewat segmen seperti "..".
  if (path.some((s) => s === '' || s === '.' || s === '..' || s.includes('/') || s.includes('\\'))) {
    return NextResponse.json({ message: 'Not found.' }, { status: 404 });
  }

  const token = readToken(request);
  if (!token) {
    return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });
  }

  const search = new URL(request.url).search;
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.text() : '';

  const headers = new Headers({ Accept: 'application/json', Authorization: `Bearer ${token}` });
  if (body) headers.set('Content-Type', request.headers.get('content-type') ?? 'application/json');

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl()}/${path.map(encodeURIComponent).join('/')}${search}`, {
      method: request.method,
      headers,
      body: body || undefined,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json({ message: 'Server tidak dapat dihubungi. Coba lagi nanti.' }, { status: 502 });
  }

  if (upstream.status === 204 || upstream.status === 205) {
    return new NextResponse(null, { status: upstream.status });
  }

  // Byte mentah (bukan text()) supaya BOM UTF-8 pada CSV tidak terbuang; Content-Disposition dibawa untuk nama berkas unduhan.
  const responseHeaders: Record<string, string> = { 'Content-Type': upstream.headers.get('content-type') ?? 'application/json' };
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) responseHeaders['Content-Disposition'] = disposition;

  const res = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  if (upstream.status === 401) clearToken(res);

  return res;
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
