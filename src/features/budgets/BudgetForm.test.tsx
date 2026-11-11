import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { BudgetForm } from './BudgetForm';

const cat = (id: string, name: string, parent_id: string | null = null) => ({ id, parent_id, name, type: 'expense', icon: null, color: null });
const existing = { id: 'b1', category_id: 'c2', category_name: 'Transportasi', amount: 250000, spent: 0, remaining: 250000, percent: 0, status: 'ok' as const };

function serve(extra: Record<string, (init: RequestInit) => Response> = {}, categories = [cat('c1', 'Makanan'), cat('c2', 'Transportasi'), cat('c3', 'Kopi', 'c1')]) {
  return routeFetch({
    '/api/proxy/categories': () => jsonResponse(200, { data: categories }),
    '/api/proxy/budgets?month=': () => jsonResponse(200, { data: [existing] }),
    ...extra,
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('BudgetForm', () => {
  it('offers only expense categories that have no budget yet, with the parent name on children', async () => {
    serve();
    renderWithClient(<BudgetForm month="2026-11" onDone={vi.fn()} />);

    const select = await screen.findByLabelText('Kategori');
    await waitFor(() => expect(within(select).getAllByRole('option').length).toBeGreaterThan(1));
    const labels = within(select).getAllByRole('option').map((o) => o.textContent);

    expect(labels).toEqual(['Pilih kategori', 'Makanan', 'Makanan › Kopi']);
  });

  it('sends the category and a plain integer amount', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/budgets': () => jsonResponse(201, { data: { id: 'b9', category_id: 'c1', amount: 1500000 } }) });
    const onDone = vi.fn();
    renderWithClient(<BudgetForm month="2026-11" onDone={onDone} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'Makanan' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Kategori'), 'c1');
    await user.type(screen.getByLabelText('Batas per bulan (Rp)'), '1.500.000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const put = mock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PUT')!;
    expect(put[0]).toBe('/api/proxy/budgets');
    expect(JSON.parse((put[1] as RequestInit).body as string)).toEqual({ category_id: 'c1', amount: 1500000 });
  });

  it('edits an existing budget with the category locked and the amount prefilled', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/budgets': () => jsonResponse(200, { data: { id: 'b1', category_id: 'c2', amount: 300000 } }) });
    const onDone = vi.fn();
    renderWithClient(<BudgetForm month="2026-11" budget={existing} onDone={onDone} />);

    expect(screen.getByLabelText('Kategori')).toBeDisabled();
    expect(screen.getByLabelText('Kategori')).toHaveDisplayValue('Transportasi');
    const amount = screen.getByLabelText('Batas per bulan (Rp)');
    expect(amount).toHaveValue('250.000');

    await user.clear(amount);
    await user.type(amount, '300000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const put = mock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PUT')!;
    expect(JSON.parse((put[1] as RequestInit).body as string)).toEqual({ category_id: 'c2', amount: 300000 });
  });

  it('shows validation messages before sending anything', async () => {
    const user = userEvent.setup();
    const mock = serve();
    renderWithClient(<BudgetForm month="2026-11" onDone={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Pilih kategori.')).toBeInTheDocument();
    expect(mock.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'PUT')).toBe(false);
  });

  it('maps a 422 from the server onto the amount field', async () => {
    const user = userEvent.setup();
    serve({ '/api/proxy/budgets': () => jsonResponse(422, { message: 'x', errors: { amount: ['Jumlah terlalu besar.'] } }) });
    renderWithClient(<BudgetForm month="2026-11" onDone={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'Makanan' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Kategori'), 'c1');
    await user.type(screen.getByLabelText('Batas per bulan (Rp)'), '1000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Jumlah terlalu besar.')).toBeInTheDocument();
  });

  it('explains when there is nothing left to budget', async () => {
    serve({}, [cat('c2', 'Transportasi')]);
    renderWithClient(<BudgetForm month="2026-11" onDone={vi.fn()} />);

    expect(await screen.findByText('Semua kategori pengeluaran sudah punya anggaran.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
  });

  it('points to the categories page when none exist', async () => {
    serve({}, []);
    renderWithClient(<BudgetForm month="2026-11" onDone={vi.fn()} />);

    expect(await screen.findByText(/Belum ada kategori pengeluaran/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
  });
});
