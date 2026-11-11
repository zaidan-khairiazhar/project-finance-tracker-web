import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

export const jsonResponse = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Stub fetch dengan daftar respons berurutan; mengembalikan mock-nya untuk diperiksa. */
export function stubFetch(...responses: Response[]) {
  const mock = vi.fn();
  responses.forEach((r) => mock.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', mock);
  return mock;
}

/**
 * Stub fetch berdasarkan awalan URL (yang paling spesifik/terpanjang menang). Handler menerima init
 * permintaan sehingga test dapat memeriksa method dan body. URL tak dikenal melempar error.
 */
export function routeFetch(handlers: Record<string, (init: RequestInit) => Response>) {
  const keys = Object.keys(handlers).sort((a, b) => b.length - a.length);
  const mock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const key = keys.find((k) => String(url).startsWith(k));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    return handlers[key](init);
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

export const fetchedUrls = (mock: { mock: { calls: unknown[][] } }) => mock.mock.calls.map(([u]) => String(u));
