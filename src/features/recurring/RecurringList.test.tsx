import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { RecurringList } from './RecurringList';

const rule = (over = {}) => ({
  id: 'r1', wallet_id: 'w1', wallet_name: 'Kas', category_id: 'c1', category_name: 'Gaji', type: 'income',
  amount: 5000000, note: null, frequency: 'monthly', start_date: '2026-10-25', end_date: null,
  next_due_date: '2026-11-25', is_active: true, paused_reason: null, status: 'active', ...over,
});

const serve = (rows: unknown[], extra: Record<string, (init: RequestInit) => Response> = {}) =>
  routeFetch({ '/api/proxy/recurring-rules': () => jsonResponse(200, { data: rows }), ...extra });

const methodsOf = (mock: { mock: { calls: unknown[][] } }) =>
  mock.mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method ?? 'GET');

afterEach(() => vi.unstubAllGlobals());

describe('RecurringList', () => {
  it('shows a skeleton while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Memuat transaksi berulang' })).toBeInTheDocument();
  });

  it('shows category, amount, schedule and next due date', async () => {
    serve([rule()]);
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    const item = (await screen.findByText('Gaji')).closest('li') as HTMLElement;
    // Pencocokan teks bawaan menormalkan NBSP menjadi spasi biasa, jadi periksa textContent mentah.
    expect(within(item).getByText((_, el) => el?.tagName === 'P' && el.textContent === '+Rp\u00a05.000.000')).toBeInTheDocument();
    expect(within(item).getByText('Setiap bulan tanggal 25')).toBeInTheDocument();
    expect(within(item).getByText(/25 Nov 2026/)).toBeInTheDocument();
  });

  it('falls back to the note, then the wallet name, without a category', async () => {
    serve([
      rule({ id: 'r1', category_id: null, category_name: null, note: 'Langganan' }),
      rule({ id: 'r2', category_id: null, category_name: null, note: null, wallet_name: 'Dompet Utama' }),
    ]);
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    expect(await screen.findByText('Langganan')).toBeInTheDocument();
    expect(screen.getByText('Dompet Utama')).toBeInTheDocument();
  });

  it('labels every status in words with a hidden icon', async () => {
    serve([
      rule({ id: 'r1', category_name: 'Aktif1' }),
      rule({ id: 'r2', category_name: 'Dijeda1', is_active: false, status: 'paused', paused_reason: 'wallet_archived' }),
      rule({ id: 'r3', category_name: 'Manual', is_active: false, status: 'paused', paused_reason: null }),
      rule({ id: 'r4', category_name: 'Selesai1', is_active: false, status: 'finished', end_date: '2026-10-31' }),
    ]);
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    const item = async (name: string) => (await screen.findByText(name)).closest('li') as HTMLElement;
    const active = within(await item('Aktif1')).getByText('Aktif');
    expect(active.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(within(await item('Dijeda1')).getByText('Dijeda · Dompet diarsipkan')).toBeInTheDocument();
    expect(within(await item('Manual')).getByText('Dijeda')).toBeInTheDocument();
    expect(within(await item('Selesai1')).getByText('Selesai')).toBeInTheDocument();
  });

  it('pauses an active rule with PATCH is_active false', async () => {
    const user = userEvent.setup();
    const mock = serve([rule()], { '/api/proxy/recurring-rules/r1': () => jsonResponse(200, { data: rule({ is_active: false }) }) });
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Jeda Gaji' }));

    await waitFor(() => expect(methodsOf(mock)).toContain('PATCH'));
    const call = mock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PATCH')!;
    expect(String(call[0])).toBe('/api/proxy/recurring-rules/r1');
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({ is_active: false });
  });

  it('activates a paused rule with PATCH is_active true', async () => {
    const user = userEvent.setup();
    const paused = rule({ is_active: false, status: 'paused', paused_reason: 'wallet_archived' });
    const mock = serve([paused], { '/api/proxy/recurring-rules/r1': () => jsonResponse(200, { data: rule() }) });
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Aktifkan Gaji' }));

    await waitFor(() => expect(methodsOf(mock)).toContain('PATCH'));
    const call = mock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'PATCH')!;
    expect(JSON.parse((call[1] as RequestInit).body as string)).toEqual({ is_active: true });
  });

  it('offers no pause button for a finished rule', async () => {
    serve([rule({ is_active: false, status: 'finished', end_date: '2026-10-31' })]);
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    await screen.findByText('Gaji');
    expect(screen.queryByRole('button', { name: /^Jeda/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Aktifkan/ })).not.toBeInTheDocument();
  });

  it('shows the real end date, not the next due date, for a finished rule', async () => {
    serve([rule({ is_active: false, status: 'finished', end_date: '2026-10-31', next_due_date: '2026-11-25' })]);
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    const item = (await screen.findByText('Gaji')).closest('li') as HTMLElement;
    expect(within(item).getByText(/Berakhir 31 Okt 2026/)).toBeInTheDocument();
    expect(within(item).queryByText(/25 Nov 2026/)).not.toBeInTheDocument();
  });

  it('opens the editor for a rule', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    serve([rule()]);
    renderWithClient(<RecurringList onEdit={onEdit} />);

    await user.click(await screen.findByRole('button', { name: 'Ubah Gaji' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));
  });

  it('deletes after confirmation and not when cancelled', async () => {
    const user = userEvent.setup();
    const mock = serve([rule()], { '/api/proxy/recurring-rules/r1': () => new Response(null, { status: 204 }) });
    renderWithClient(<RecurringList onEdit={vi.fn()} />);
    const button = await screen.findByRole('button', { name: 'Hapus Gaji' });

    vi.stubGlobal('confirm', () => false);
    await user.click(button);
    expect(methodsOf(mock)).not.toContain('DELETE');

    vi.stubGlobal('confirm', () => true);
    await user.click(button);
    await waitFor(() => expect(methodsOf(mock)).toContain('DELETE'));
  });

  it('shows a friendly empty state', async () => {
    serve([]);
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    expect(await screen.findByText('Belum ada transaksi berulang')).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    routeFetch({ '/api/proxy/recurring-rules': () => jsonResponse(500, { message: 'Server error' }) });
    renderWithClient(<RecurringList onEdit={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
