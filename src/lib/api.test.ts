import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api';

const respond = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

afterEach(() => vi.unstubAllGlobals());

describe('api', () => {
  it('calls the proxy and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(200, { data: [1] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api<{ data: number[] }>('wallets')).resolves.toEqual({ data: [1] });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/proxy/wallets');
  });

  it('sends a JSON body with the right header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(201, { data: {} }));
    vi.stubGlobal('fetch', fetchMock);

    await api('wallets', { method: 'POST', body: JSON.stringify({ name: 'BCA' }) });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(api('wallets/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws ApiError carrying status and field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respond(422, { message: 'Invalid', errors: { name: ['Wajib.'] } })),
    );

    await expect(api('wallets', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Invalid',
      errors: { name: ['Wajib.'] },
    });
  });

  it('redirects to /login on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, { message: 'Unauthenticated.' })));
    const assign = vi.fn();
    vi.stubGlobal('location', { assign, pathname: '/dashboard' });

    await expect(api('wallets')).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith('/login');
  });
});
