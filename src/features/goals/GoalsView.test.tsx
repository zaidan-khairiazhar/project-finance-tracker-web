import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { GoalsView } from './GoalsView';

const goal = {
  id: 'g1', name: 'Dana darurat', wallet_id: 'w2', wallet_name: 'Tabungan', wallet_status: 'ok',
  target_amount: 10000000, current_amount: 0, remaining: 10000000, percent: 0, status: 'in_progress',
  deadline: null, monthly_needed: null,
};
const wallet = (id: string, name: string) => ({ id, name, type: 'cash', initial_balance: 0, currency: 'IDR', is_archived: false, balance: 0 });

const serve = (rows: unknown[] = []) =>
  routeFetch({
    '/api/proxy/goals': (init) => (init?.method === 'POST' ? jsonResponse(201, { data: goal }) : jsonResponse(200, { data: rows })),
    '/api/proxy/goals/g1': () => jsonResponse(200, { data: goal }),
    '/api/proxy/wallets': () => jsonResponse(200, { data: [wallet('w1', 'Kas'), wallet('w2', 'Tabungan')] }),
  });

afterEach(() => vi.unstubAllGlobals());

describe('GoalsView', () => {
  it('opens the create dialog and closes it after saving', async () => {
    const user = userEvent.setup();
    serve();
    renderWithClient(<GoalsView />);

    await user.click(await screen.findByRole('button', { name: 'Tambah target' }));
    expect(await screen.findByRole('dialog', { name: 'Tambah target' })).toBeInTheDocument();

    await screen.findByRole('option', { name: 'Kas' });
    await user.type(screen.getByLabelText('Nama target'), 'Liburan');
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.type(screen.getByLabelText('Nominal target (Rp)'), '5.000.000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens the edit dialog with the goal values from "Ubah"', async () => {
    const user = userEvent.setup();
    serve([goal]);
    renderWithClient(<GoalsView />);

    await user.click(await screen.findByRole('button', { name: /Ubah/ }));

    expect(await screen.findByRole('dialog', { name: 'Ubah target' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nama target')).toHaveValue('Dana darurat');
    expect(screen.getByLabelText('Nominal target (Rp)')).toHaveValue('10.000.000');
  });
});
