// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { proxy } from './proxy';

const req = (path: string, cookie?: string) =>
  new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined);
const location = (res: Response) => res.headers.get('location');

describe('route guard', () => {
  it('sends anonymous visitors of private pages to /login', () => {
    expect(location(proxy(req('/dashboard')))).toBe('http://localhost:3000/login');
    expect(location(proxy(req('/')))).toBe('http://localhost:3000/login');
  });

  it('sends signed-in visitors of auth pages and / to /dashboard', () => {
    expect(location(proxy(req('/login', 'token=abc')))).toBe('http://localhost:3000/dashboard');
    expect(location(proxy(req('/register', 'token=abc')))).toBe('http://localhost:3000/dashboard');
    expect(location(proxy(req('/', 'token=abc')))).toBe('http://localhost:3000/dashboard');
  });

  it('lets the right visitor through', () => {
    expect(location(proxy(req('/login')))).toBeNull();
    expect(location(proxy(req('/dashboard', 'token=abc')))).toBeNull();
  });
});
