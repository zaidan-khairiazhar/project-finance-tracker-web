// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { POST } from './route';

afterEach(() => vi.unstubAllGlobals());

it('register creates the account, sets the cookie, and hides the token', async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({ data: { user: { id: 'u1', name: 'Z', email: 'z@x.com' }, token: 'secret-token' } }),
      { status: 201, headers: { 'Content-Type': 'application/json' } },
    ),
  );
  vi.stubGlobal('fetch', fetchMock);

  const res = await POST(
    new Request('http://t/api/session/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Z', email: 'z@x.com', password: 'rahasia123', password_confirmation: 'rahasia123' }),
    }),
  );

  expect(res.status).toBe(201);
  expect(res.headers.get('set-cookie')).toMatch(/token=secret-token.*HttpOnly/i);
  expect(JSON.stringify(await res.json())).not.toContain('secret-token');
  expect(String(fetchMock.mock.calls[0][0])).toBe('http://localhost:8000/api/v1/auth/register');
});
