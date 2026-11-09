import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient } from '@/test/utils';
import { DashboardView } from './DashboardView';

const summary = { month: '2026-11', income: 5000000, expense: 1500000, net: 3500000, total_balance: 9000000 };
const tx = (i: number) => ({
  id: `t${i}`, wallet_id: 'w1', category_id: null, type: 'expense', amount: 1000 * i,
  occurred_at: '2026-11-07T16:30:00Z', note: `catatan ${i}`, transfer_group_id: null,
});

function route(over: Record<string, () => Response> = {}) {
  const handlers: Record<string, () => Response> = {
    '/api/proxy/dashboard/summary': () => jsonResponse(200, { data: summary }),
    '/api/proxy/dashboard/by-category': () => jsonResponse(200, { data: [{ category_id: 'c1', name: 'Makanan', color: null, total: 900000 }] }),
    '/api/proxy/transactions': () => jsonResponse(200, { data: [tx(1), tx(2)], meta: { next_cursor: null } }),
    '/api/proxy/wallets': () => jsonResponse(200, { data: [{ id: 'w1', name: 'BCA' }] }),
    '/api/proxy/categories': () => jsonResponse(200, { data: [] }),
    ...over,
  };
  const mock = vi.fn(async (url: string) => {
    const key = Object.keys(handlers).find((k) => url.startsWith(k));
    if (!key) throw new Error(`unexpected fetch ${url}`);
    return handlers[key]();
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}
const urls = (mock: ReturnType<typeof route>) => mock.mock.calls.map(([u]) => String(u));

afterEach(() => vi.unstubAllGlobals());

describe('DashboardView', () => {
  it('shows skeletons while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderWithClient(<DashboardView initialMonth="2026-11" currentMonth="2026-11" />);

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });

  it('renders summary, breakdown and the five latest transactions', async () => {
    const mock = route();
    renderWithClient(<DashboardView initialMonth="2026-11" currentMonth="2026-11" />);

    expect(await screen.findByText('Rp 9.000.000')).toBeInTheDocument();
    expect(await screen.findByText('Makanan')).toBeInTheDocument();
    expect(await screen.findByText('catatan 1')).toBeInTheDocument();
    expect(urls(mock)).toContain('/api/proxy/dashboard/summary?month=2026-11');
    expect(urls(mock)).toContain('/api/proxy/dashboard/by-category?month=2026-11&type=expense');
    expect(urls(mock).some((u) => u.startsWith('/api/proxy/transactions') && u.includes('per_page=5'))).toBe(true);
  });

  it('refetches summary and breakdown for another month', async () => {
    const user = userEvent.setup();
    const mock = route();
    renderWithClient(<DashboardView initialMonth="2026-11" currentMonth="2026-11" />);
    await screen.findByText('Rp 9.000.000');

    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }));

    await waitFor(() => expect(urls(mock)).toContain('/api/proxy/dashboard/summary?month=2026-10'));
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument();
  });

  it('switches the breakdown to income', async () => {
    const user = userEvent.setup();
    const mock = route();
    renderWithClient(<DashboardView initialMonth="2026-11" currentMonth="2026-11" />);
    await screen.findByText('Makanan');

    await user.click(screen.getByRole('radio', { name: 'Pemasukan' }));

    await waitFor(() => expect(urls(mock)).toContain('/api/proxy/dashboard/by-category?month=2026-11&type=income'));
  });

  it('shows an error with retry when the summary fails', async () => {
    route({ '/api/proxy/dashboard/summary': () => jsonResponse(500, { message: 'Server error' }) });
    renderWithClient(<DashboardView initialMonth="2026-11" currentMonth="2026-11" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });

  it('shows a friendly message when there are no transactions yet', async () => {
    route({ '/api/proxy/transactions': () => jsonResponse(200, { data: [], meta: { next_cursor: null } }) });
    renderWithClient(<DashboardView initialMonth="2026-11" currentMonth="2026-11" />);

    expect(await screen.findByText('Belum ada transaksi')).toBeInTheDocument();
  });
});
