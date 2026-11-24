import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import type { Goal } from './api';
import { GoalForm } from './GoalForm';

const wallet = (id: string, name: string, is_archived = false) => ({ id, name, type: 'cash', initial_balance: 0, currency: 'IDR', is_archived, balance: 0 });
const wallets = [wallet('w1', 'Kas'), wallet('w2', 'Tabungan'), wallet('w3', 'Lama', true), wallet('w4', 'Bank')];

const goal: Goal = {
  id: 'g1', name: 'Dana darurat', wallet_id: 'w2', wallet_name: 'Tabungan', wallet_status: 'ok',
  target_amount: 10000000, current_amount: 0, remaining: 10000000, percent: 0, status: 'in_progress',
  deadline: '2099-12-31', monthly_needed: 1000,
};
const otherGoal = { ...goal, id: 'g2', wallet_id: 'w4', wallet_name: 'Bank' };

function serve(extra: Record<string, (init: RequestInit) => Response> = {}) {
  return routeFetch({
    '/api/proxy/wallets': () => jsonResponse(200, { data: wallets }),
    '/api/proxy/goals': () => jsonResponse(200, { data: [goal, otherGoal] }),
    ...extra,
  });
}
const callWith = (mock: { mock: { calls: unknown[][] } }, method: string) =>
  mock.mock.calls.find(([, init]) => (init as RequestInit)?.method === method)!;
const bodyOf = (call: unknown[]) => JSON.parse((call[1] as RequestInit).body as string);
const options = () => within(screen.getByLabelText('Dompet')).getAllByRole('option').map((o) => o.textContent);

afterEach(() => vi.unstubAllGlobals());

describe('GoalForm', () => {
  it('offers only active wallets without a goal', async () => {
    serve();
    renderWithClient(<GoalForm onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Kas' });
    await waitFor(() => expect(options()).toEqual(['Pilih dompet', 'Kas']));
  });

  it('keeps the wallet of the goal being edited, selected', async () => {
    serve();
    renderWithClient(<GoalForm goal={goal} onDone={vi.fn()} />);

    await screen.findByRole('option', { name: 'Tabungan' });
    await waitFor(() => expect(options()).toEqual(['Pilih dompet', 'Kas', 'Tabungan']));
    expect(screen.getByLabelText('Dompet')).toHaveValue('w2');
    expect(screen.getByLabelText('Nominal target (Rp)')).toHaveValue('10.000.000');
    expect(screen.getByLabelText('Tenggat (opsional)')).toHaveValue('2099-12-31');
  });

  it('creates a goal with a plain integer amount and a null deadline', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/goals': (init) => (init?.method === 'POST' ? jsonResponse(201, { data: goal }) : jsonResponse(200, { data: [] })) });
    const onDone = vi.fn();
    renderWithClient(<GoalForm onDone={onDone} />);

    await screen.findByRole('option', { name: 'Kas' });
    await user.type(screen.getByLabelText('Nama target'), 'Liburan');
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.type(screen.getByLabelText('Nominal target (Rp)'), '5.000.000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const post = callWith(mock, 'POST');
    expect(post[0]).toBe('/api/proxy/goals');
    expect(bodyOf(post)).toEqual({ name: 'Liburan', wallet_id: 'w1', target_amount: 5000000, deadline: null });
  });

  it('sends the full body on PATCH', async () => {
    const user = userEvent.setup();
    const mock = serve({ '/api/proxy/goals/g1': () => jsonResponse(200, { data: goal }) });
    const onDone = vi.fn();
    renderWithClient(<GoalForm goal={goal} onDone={onDone} />);

    await screen.findByRole('option', { name: 'Tabungan' });
    await user.clear(screen.getByLabelText('Nama target'));
    await user.type(screen.getByLabelText('Nama target'), 'Baru');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const patch = callWith(mock, 'PATCH');
    expect(patch[0]).toBe('/api/proxy/goals/g1');
    expect(bodyOf(patch)).toEqual({ name: 'Baru', wallet_id: 'w2', target_amount: 10000000, deadline: '2099-12-31' });
  });

  it('shows a 422 on the wallet field', async () => {
    const user = userEvent.setup();
    serve({
      '/api/proxy/goals': (init) =>
        init?.method === 'POST'
          ? jsonResponse(422, { message: 'x', errors: { wallet_id: ['Dompet ini sudah punya target.'] } })
          : jsonResponse(200, { data: [] }),
    });
    const onDone = vi.fn();
    renderWithClient(<GoalForm onDone={onDone} />);

    await screen.findByRole('option', { name: 'Kas' });
    await user.type(screen.getByLabelText('Nama target'), 'Liburan');
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');
    await user.type(screen.getByLabelText('Nominal target (Rp)'), '5.000.000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Dompet ini sudah punya target.')).toBeInTheDocument();
    expect(screen.getByLabelText('Dompet')).toHaveAttribute('aria-invalid', 'true');
    expect(onDone).not.toHaveBeenCalled();
  });
});
