import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import type { RecurringRule } from './api';
import { RecurringForm } from './RecurringForm';
import { minStartDate, todayJakarta } from './schema';

const cat = (id: string, name: string, type: string, parent_id: string | null = null) => ({ id, parent_id, name, type, icon: null, color: null });
const wallet = (id: string, name: string, is_archived = false) => ({ id, name, type: 'cash', initial_balance: 0, currency: 'IDR', is_archived, balance: 0 });
const categories = [cat('e1', 'Makanan', 'expense'), cat('e2', 'Kopi', 'expense', 'e1'), cat('i1', 'Gaji', 'income')];

const rule: RecurringRule = {
  id: 'r1', wallet_id: 'w1', wallet_name: 'Kas', category_id: 'i1', category_name: 'Gaji', type: 'income',
  amount: 5000000, note: 'Gaji bulanan', frequency: 'monthly', start_date: '2025-01-25', end_date: '2026-12-31',
  next_due_date: '2026-11-25', is_active: true, paused_reason: null, status: 'active',
};

function serve(extra: Record<string, (init: RequestInit) => Response> = {}) {
  return routeFetch({
    '/api/proxy/categories?type=expense': () => jsonResponse(200, { data: categories.filter((c) => c.type === 'expense') }),
    '/api/proxy/categories?type=income': () => jsonResponse(200, { data: categories.filter((c) => c.type === 'income') }),
    '/api/proxy/wallets': () => jsonResponse(200, { data: [wallet('w1', 'Kas'), wallet('w2', 'Lama', true)] }),
    ...extra,
  });
}

const callWith = (mock: { mock: { calls: unknown[][] } }, method: string) =>
  mock.mock.calls.find(([, init]) => (init as RequestInit)?.method === method)!;
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as RequestInit).body as string);

afterEach(() => vi.unstubAllGlobals());

describe('RecurringForm', () => {
  it('offers only categories of the selected type, with the parent name on children', async () => {
    const user = userEvent.setup();
    serve();
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    const options = () => within(screen.getByLabelText('Kategori')).getAllByRole('option').map((o) => o.textContent);
    await screen.findByRole('option', { name: 'Makanan' });
    expect(options()).toEqual(['Tanpa kategori', 'Makanan', 'Makanan › Kopi']);

    await user.selectOptions(screen.getByLabelText('Tipe'), 'income');
    await screen.findByRole('option', { name: 'Gaji' });
    expect(options()).toEqual(['Tanpa kategori', 'Gaji']);
  });

  it('offers only active wallets', async () => {
    serve();
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Kas' });
    expect(screen.queryByRole('option', { name: 'Lama' })).not.toBeInTheDocument();
  });

  it('restricts the start date to 366 days back', () => {
    serve();
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    expect(screen.getByLabelText('Tanggal mulai')).toHaveAttribute('min', minStartDate());
    expect(screen.getByLabelText('Tanggal mulai')).toHaveValue(todayJakarta());
  });

  it('creates a rule with a plain integer amount', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/recurring-rules': () => jsonResponse(201, { data: rule }) });
    const onDone = vi.fn();
    renderWithClient(<RecurringForm onDone={onDone} />);

    await screen.findByRole('option', { name: 'Kas' });
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.selectOptions(screen.getByLabelText('Kategori'), 'e1');
    await user.type(screen.getByLabelText('Nominal (Rp)'), '1.500.000');
    await user.selectOptions(screen.getByLabelText('Frekuensi'), 'weekly');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const post = callWith(mock, 'POST');
    expect(post[0]).toBe('/api/proxy/recurring-rules');
    expect(bodyOf(post)).toEqual({
      type: 'expense', wallet_id: 'w1', category_id: 'e1', amount: 1500000, note: null,
      frequency: 'weekly', start_date: todayJakarta(), end_date: null,
    });
  });

  it('locks type, frequency and start date in edit mode and leaves them out of the PATCH', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/recurring-rules/r1': () => jsonResponse(200, { data: rule }) });
    const onDone = vi.fn();
    renderWithClient(<RecurringForm rule={rule} onDone={onDone} />);

    expect(screen.getByLabelText('Frekuensi')).toBeDisabled();
    expect(screen.getByLabelText('Tanggal mulai')).toBeDisabled();
    expect(screen.getByLabelText('Tipe')).toBeDisabled();
    expect(screen.getByLabelText('Tanggal mulai')).toHaveValue('2025-01-25');
    expect(screen.getAllByText(/Hapus lalu buat ulang/)).toHaveLength(3);
    expect(screen.getByLabelText('Nominal (Rp)')).toHaveValue('5.000.000');

    await screen.findByRole('option', { name: 'Gaji' });
    await user.clear(screen.getByLabelText('Tanggal akhir (opsional)'));
    await user.clear(screen.getByLabelText('Nominal (Rp)'));
    await user.type(screen.getByLabelText('Nominal (Rp)'), '6000000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const patch = callWith(mock, 'PATCH');
    expect(patch[0]).toBe('/api/proxy/recurring-rules/r1');
    const body = bodyOf(patch);
    expect(body).toEqual({ wallet_id: 'w1', category_id: 'i1', amount: 6000000, note: 'Gaji bulanan', end_date: null });
    expect(body).not.toHaveProperty('frequency');
    expect(body).not.toHaveProperty('start_date');
    expect(body).not.toHaveProperty('type');
  });

  it('shows the rule wallet and category as selected once options load', async () => {
    serve();
    renderWithClient(<RecurringForm rule={rule} onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Gaji' });
    await screen.findByRole('option', { name: 'Kas' });
    expect(screen.getByLabelText('Kategori')).toHaveValue('i1');
    expect(screen.getByLabelText('Dompet')).toHaveValue('w1');
  });

  it('resets the category when the type changes', async () => {
    const user = userEvent.setup();
    serve();
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Makanan' });
    await user.selectOptions(screen.getByLabelText('Kategori'), 'e1');
    expect(screen.getByLabelText('Kategori')).toHaveValue('e1');
    await user.selectOptions(screen.getByLabelText('Tipe'), 'income');
    await screen.findByRole('option', { name: 'Gaji' });
    expect(screen.getByLabelText('Kategori')).toHaveValue('');
  });

  it('rejects an end date before the start date without calling the API', async () => {
    const user = userEvent.setup();
    const mock = serve();
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Kas' });
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.type(screen.getByLabelText('Nominal (Rp)'), '1000');
    await user.type(screen.getByLabelText('Tanggal akhir (opsional)'), '2000-01-01');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Tanggal akhir tidak boleh sebelum tanggal mulai.')).toBeInTheDocument();
    expect(mock.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'POST')).toBe(false);
  });

  it('rejects an amount of 0 without calling the API', async () => {
    const user = userEvent.setup();
    const mock = serve();
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Kas' });
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.type(screen.getByLabelText('Nominal (Rp)'), '0');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Jumlah harus lebih dari 0.')).toBeInTheDocument();
    expect(mock.mock.calls.some(([, init]) => (init as RequestInit)?.method === 'POST')).toBe(false);
  });

  it('shows a server 422 on the matching field', async () => {
    const user = userEvent.setup();
    serve({ '/api/proxy/recurring-rules': () => jsonResponse(422, { message: 'x', errors: { start_date: ['Tanggal mulai terlalu lama.'] } }) });
    renderWithClient(<RecurringForm onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Kas' });
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.type(screen.getByLabelText('Nominal (Rp)'), '1000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Tanggal mulai terlalu lama.')).toBeInTheDocument();
  });
});
