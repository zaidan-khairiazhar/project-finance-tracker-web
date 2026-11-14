import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { RecurringView } from './RecurringView';

const rule = {
  id: 'r1', wallet_id: 'w1', wallet_name: 'Kas', category_id: null, category_name: null, type: 'income',
  amount: 5000000, note: 'Gaji', frequency: 'monthly', start_date: '2026-10-25', end_date: null,
  next_due_date: '2026-11-25', is_active: true, paused_reason: null, status: 'active',
};

const serve = (extra: Record<string, (init: RequestInit) => Response> = {}, rows: unknown[] = []) =>
  routeFetch({
    '/api/proxy/recurring-rules': () => jsonResponse(200, { data: rows }),
    '/api/proxy/categories': () => jsonResponse(200, { data: [] }),
    '/api/proxy/wallets': () => jsonResponse(200, { data: [] }),
    ...extra,
  });

afterEach(() => vi.unstubAllGlobals());

describe('RecurringView', () => {
  it('runs due rules and reports how many transactions were created', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/recurring-rules/run': () => jsonResponse(200, { created: 3 }) });
    renderWithClient(<RecurringView />);

    await user.click(await screen.findByRole('button', { name: 'Jalankan sekarang' }));

    const message = await screen.findByText('3 transaksi dibuat');
    expect(message).toHaveAttribute('role', 'status');
    const run = mock.mock.calls.find(([u]) => String(u) === '/api/proxy/recurring-rules/run')!;
    expect((run[1] as RequestInit).method).toBe('POST');
  });

  it('shows an alert when running fails', async () => {
    const user = userEvent.setup();
    serve({ '/api/proxy/recurring-rules/run': () => jsonResponse(500, { message: 'Gagal.' }) });
    renderWithClient(<RecurringView />);

    await user.click(await screen.findByRole('button', { name: 'Jalankan sekarang' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('opens the create dialog from "Tambah aturan"', async () => {
    const user = userEvent.setup();
    serve();
    renderWithClient(<RecurringView />);

    await user.click(await screen.findByRole('button', { name: 'Tambah aturan' }));

    expect(await screen.findByRole('dialog', { name: 'Tambah aturan' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nominal (Rp)')).toBeInTheDocument();
  });

  it('opens the edit dialog with the rule values from "Ubah"', async () => {
    const user = userEvent.setup();
    serve({}, [rule]);
    renderWithClient(<RecurringView />);

    await user.click(await screen.findByRole('button', { name: /Ubah/ }));

    expect(await screen.findByRole('dialog', { name: 'Ubah aturan' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nominal (Rp)')).toHaveValue('5.000.000');
  });
});
