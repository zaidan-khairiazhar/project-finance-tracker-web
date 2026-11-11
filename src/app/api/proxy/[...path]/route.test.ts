// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from './route';

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });
const withCookie = (url: string, init: RequestInit = {}) =>
  new Request(url, { ...init, headers: { cookie: 'token=abc', ...(init.headers as object) } });

afterEach(() => vi.unstubAllGlobals());

describe('/api/proxy', () => {
  it('forwards method, query and body with the bearer token from the cookie', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(
      withCookie('http://t/api/proxy/transactions?x=1', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: 5 }),
      }),
      ctx('transactions'),
    );

    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe('http://localhost:8000/api/v1/transactions?x=1');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ amount: 5 }));
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer abc');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('answers 401 without calling upstream when there is no cookie', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(new Request('http://t/api/proxy/wallets'), ctx('wallets'));

    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears the cookie when upstream says 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"Unauthenticated."}', { status: 401 })));

    const res = await GET(withCookie('http://t/api/proxy/wallets'), ctx('wallets'));

    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toMatch(/token=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it('passes 204 through with no body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const res = await DELETE(withCookie('http://t/api/proxy/wallets/1', { method: 'DELETE' }), ctx('wallets', '1'));

    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  it('refuses path traversal segments', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await GET(withCookie('http://t/api/proxy/../x'), ctx('..', 'auth', 'me'));

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes a CSV download through with its headers and the UTF-8 BOM intact', async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode('Tanggal,Catatan\n2026-11-01,Kopi\n')]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(bytes, {
          status: 200,
          headers: { 'Content-Type': 'text/csv; charset=UTF-8', 'Content-Disposition': 'attachment; filename="transaksi-20261111.csv"' },
        }),
      ),
    );

    const res = await GET(withCookie('http://t/api/proxy/transactions/export'), ctx('transactions', 'export'));

    expect(res.headers.get('content-type')).toBe('text/csv; charset=UTF-8');
    expect(res.headers.get('content-disposition')).toBe('attachment; filename="transaksi-20261111.csv"');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });

  it('adds no Content-Disposition to ordinary JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200, headers: { 'Content-Type': 'application/json' } })));

    const res = await GET(withCookie('http://t/api/proxy/wallets'), ctx('wallets'));

    expect(res.headers.get('content-disposition')).toBeNull();
  });
});
