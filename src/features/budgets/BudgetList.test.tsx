import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { BudgetList } from './BudgetList';

const budget = (over = {}) => ({
  id: 'b1', category_id: 'c1', category_name: 'Makanan', amount: 1000000, spent: 250000,
  remaining: 750000, percent: 25, status: 'ok', ...over,
});

const serve = (rows: unknown[]) => routeFetch({ '/api/proxy/budgets': () => jsonResponse(200, { data: rows }) });

afterEach(() => vi.unstubAllGlobals());

describe('BudgetList', () => {
  it('shows a skeleton while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Memuat anggaran' })).toBeInTheDocument();
  });

  it('requests the selected month and shows amounts, percent and remaining', async () => {
    const mock = serve([budget()]);
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);

    expect(await screen.findByText('Makanan')).toBeInTheDocument();
    expect(fetchedUrls(mock)).toContain('/api/proxy/budgets?month=2026-11');
    expect(screen.getByText('Rp 250.000 dari Rp 1.000.000')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('Sisa Rp 750.000')).toBeInTheDocument();
  });

  it('labels every status in words, not only by colour', async () => {
    serve([
      budget({ id: 'b1', category_name: 'Sehat', status: 'ok' }),
      budget({ id: 'b2', category_name: 'Hampir', status: 'warning', percent: 90, spent: 900000, remaining: 100000 }),
      budget({ id: 'b3', category_name: 'Lewat', status: 'over', percent: 120, spent: 1200000, remaining: -200000 }),
    ]);
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);

    const item = async (name: string) => (await screen.findByText(name)).closest('li') as HTMLElement;
    expect(within(await item('Sehat')).getByText('Aman')).toBeInTheDocument();
    expect(within(await item('Hampir')).getByText('Hampir habis')).toBeInTheDocument();
    const over = await item('Lewat');
    expect(within(over).getByText('Melebihi')).toBeInTheDocument();
    expect(within(over).getByText('Lebih Rp 200.000')).toBeInTheDocument();
  });

  it('caps the bar at 100% when over budget', async () => {
    serve([budget({ status: 'over', percent: 250, spent: 2500000, remaining: -1500000 })]);
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);

    const meter = await screen.findByRole('meter', { name: 'Makanan' });
    expect(meter).toHaveAttribute('aria-valuenow', '100');
    expect(meter.firstElementChild).toHaveStyle({ width: '100%' });
  });

  it('shows a friendly empty state', async () => {
    serve([]);
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);

    expect(await screen.findByText('Belum ada anggaran')).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    routeFetch({ '/api/proxy/budgets': () => jsonResponse(500, { message: 'Server error' }) });
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });

  it('opens the editor for a budget', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    serve([budget()]);
    renderWithClient(<BudgetList month="2026-11" onEdit={onEdit} />);

    await user.click(await screen.findByRole('button', { name: 'Ubah Makanan' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1', category_id: 'c1' }));
  });

  it('deletes after confirmation and not when cancelled', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({
      '/api/proxy/budgets/b1': () => new Response(null, { status: 204 }),
      '/api/proxy/budgets': () => jsonResponse(200, { data: [budget()] }),
    });
    renderWithClient(<BudgetList month="2026-11" onEdit={vi.fn()} />);
    const button = await screen.findByRole('button', { name: 'Hapus Makanan' });

    vi.stubGlobal('confirm', () => false);
    await user.click(button);
    expect(mock.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'DELETE')).toBe(false);

    vi.stubGlobal('confirm', () => true);
    await user.click(button);
    await waitFor(() => expect(mock.mock.calls.some(([u, init]) => u === '/api/proxy/budgets/b1' && (init as RequestInit).method === 'DELETE')).toBe(true));
  });
});
