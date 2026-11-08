// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DELETE, POST } from './route';

const upstream = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('/api/session', () => {
  it('login stores the token in an httpOnly cookie and never returns it in the body', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        upstream(200, { data: { user: { id: 'u1', name: 'Zaidan', email: 'a@x.com' }, token: 'secret-token' } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(
      new Request('http://t/api/session', {
        method: 'POST',
        body: JSON.stringify({ email: 'a@x.com', password: 'p' }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toMatch(/token=secret-token.*HttpOnly.*SameSite=lax/i);
    const body = await res.json();
    expect(body).toEqual({ user: { id: 'u1', name: 'Zaidan', email: 'a@x.com' } });
    expect(JSON.stringify(body)).not.toContain('secret-token');
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://localhost:8000/api/v1/auth/login');
  });

  it('forwards upstream validation errors without setting a cookie', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(upstream(422, { message: 'x', errors: { email: ['Email atau kata sandi salah.'] } })),
    );

    const res = await POST(
      new Request('http://t/api/session', { method: 'POST', body: JSON.stringify({ email: 'a@x.com', password: 'p' }) }),
    );

    expect(res.status).toBe(422);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect((await res.json()).errors.email[0]).toBe('Email atau kata sandi salah.');
  });

  it('logout revokes the token upstream and clears the cookie', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await DELETE(
      new Request('http://t/api/session', { method: 'DELETE', headers: { cookie: 'token=abc' } }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toMatch(/token=;|token=.*Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer abc');
  });
});
