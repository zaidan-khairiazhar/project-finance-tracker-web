import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { GoalList } from './GoalList';

const goal = (over = {}) => ({
  id: 'g1', name: 'Dana Darurat', wallet_id: 'w1', wallet_name: 'Tabungan', wallet_status: 'ok',
  target_amount: 1000000, current_amount: 400000, remaining: 600000, percent: 40, status: 'in_progress',
  deadline: null, monthly_needed: null, ...over,
});

const serve = (rows: unknown[], extra: Record<string, (init: RequestInit) => Response> = {}) =>
  routeFetch({ '/api/proxy/goals': () => jsonResponse(200, { data: rows }), ...extra });

const methodsOf = (mock: { mock: { calls: unknown[][] } }) =>
  mock.mock.calls.map(([, init]) => (init as RequestInit | undefined)?.method ?? 'GET');

const itemOf = async (name: string) => (await screen.findByText(name)).closest('li') as HTMLElement;
const rawText = (text: string) => (_: string, el: Element | null) => el?.tagName === 'SPAN' && el.textContent === text;

afterEach(() => vi.unstubAllGlobals());

describe('GoalList', () => {
  it('shows a skeleton while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Memuat target' })).toBeInTheDocument();
  });

  it('shows a friendly empty state', async () => {
    serve([]);
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    expect(await screen.findByText('Belum ada target tabungan')).toBeInTheDocument();
  });

  it('shows the error with a retry button', async () => {
    routeFetch({ '/api/proxy/goals': () => jsonResponse(500, { message: 'Server error' }) });
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });

  it('shows name, wallet, amounts with NBSP and a meter at the percent', async () => {
    serve([goal()]);
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    const item = await itemOf('Dana Darurat');
    expect(within(item).getByText('Tabungan')).toBeInTheDocument();
    expect(within(item).getByText(rawText('Rp 400.000 dari Rp 1.000.000'))).toBeInTheDocument();
    const meter = within(item).getByRole('meter', { name: 'Dana Darurat' });
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuenow', '40');
    expect((meter.firstElementChild as HTMLElement).style.width).toBe('40%');
  });

  it('labels every status in words with a hidden icon and data-status', async () => {
    serve([
      goal({ id: 'g1', name: 'A', status: 'in_progress' }),
      goal({ id: 'g2', name: 'B', status: 'reached', percent: 100, remaining: 0 }),
      goal({ id: 'g3', name: 'C', status: 'overdue', deadline: '2026-10-01' }),
    ]);
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    for (const [name, status, label] of [['A', 'in_progress', 'Berjalan'], ['B', 'reached', 'Tercapai'], ['C', 'overdue', 'Lewat tenggat']]) {
      const el = within(await itemOf(name)).getByText(label);
      expect(el).toHaveAttribute('data-status', status);
      expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('shows the monthly amount needed', async () => {
    serve([goal({ deadline: '2027-01-10', monthly_needed: 300000 })]);
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    const item = await itemOf('Dana Darurat');
    expect(within(item).getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Perlu Rp 300.000 per bulan')).toBeInTheDocument();
  });

  it('shows the deadline when there is no monthly amount', async () => {
    serve([
      goal({ id: 'g1', name: 'Lewat', status: 'overdue', deadline: '2026-10-01' }),
      goal({ id: 'g2', name: 'Tanpa', deadline: null }),
    ]);
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    expect(within(await itemOf('Lewat')).getByText(/Tenggat 1 Okt 2026/)).toBeInTheDocument();
    const none = await itemOf('Tanpa');
    expect(within(none).queryByText(/Tenggat/)).not.toBeInTheDocument();
    expect(within(none).queryByText(/Perlu/)).not.toBeInTheDocument();
  });

  it('warns when the wallet is archived or deleted', async () => {
    serve([
      goal({ id: 'g1', name: 'Arsip', wallet_status: 'archived' }),
      goal({ id: 'g2', name: 'Terhapus', wallet_status: 'deleted' }),
      goal({ id: 'g3', name: 'Biasa' }),
    ]);
    renderWithClient(<GoalList onEdit={vi.fn()} />);

    expect(within(await itemOf('Arsip')).getByText('Dompet diarsipkan')).toBeInTheDocument();
    expect(within(await itemOf('Terhapus')).getByText('Dompet sudah dihapus')).toBeInTheDocument();
    expect(within(await itemOf('Biasa')).queryByText(/^Dompet /)).not.toBeInTheDocument();
  });

  it('opens the editor for a goal', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    serve([goal()]);
    renderWithClient(<GoalList onEdit={onEdit} />);

    await user.click(await screen.findByRole('button', { name: 'Ubah Dana Darurat' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'g1' }));
  });

  it('deletes after confirmation and not when cancelled', async () => {
    const user = userEvent.setup();
    const mock = serve([goal()], { '/api/proxy/goals/g1': () => new Response(null, { status: 204 }) });
    renderWithClient(<GoalList onEdit={vi.fn()} />);
    const button = await screen.findByRole('button', { name: 'Hapus Dana Darurat' });

    vi.stubGlobal('confirm', () => false);
    await user.click(button);
    expect(methodsOf(mock)).not.toContain('DELETE');

    vi.stubGlobal('confirm', () => true);
    await user.click(button);
    await waitFor(() => expect(methodsOf(mock)).toContain('DELETE'));
    const call = mock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'DELETE')!;
    expect(String(call[0])).toBe('/api/proxy/goals/g1');
  });

  it('shows a delete failure in an alert', async () => {
    const user = userEvent.setup();
    serve([goal()], { '/api/proxy/goals/g1': () => jsonResponse(500, { message: 'Gagal menghapus' }) });
    renderWithClient(<GoalList onEdit={vi.fn()} />);
    vi.stubGlobal('confirm', () => true);

    await user.click(await screen.findByRole('button', { name: 'Hapus Dana Darurat' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal menghapus');
  });
});
