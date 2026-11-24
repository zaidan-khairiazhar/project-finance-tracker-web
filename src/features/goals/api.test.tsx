import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { useCreateTransaction } from '@/features/transactions/api';
import type { TransactionValues } from '@/features/transactions/schema';
import { useCreateGoal, useGoals, type Goal } from './api';

const goal: Goal = {
  id: 'g1',
  name: 'Dana darurat',
  wallet_id: 'w1',
  wallet_name: 'Bank',
  wallet_status: 'ok',
  target_amount: 5_000_000,
  current_amount: 1_000_000,
  remaining: 4_000_000,
  percent: 20,
  status: 'in_progress',
  deadline: null,
  monthly_needed: null,
};

function Probe() {
  const goals = useGoals();
  const createTx = useCreateTransaction();
  const createGoal = useCreateGoal();
  return (
    <div>
      <span>{goals.data ? `goals ${goals.data.length}` : 'loading'}</span>
      <button onClick={() => createTx.mutate({} as TransactionValues)}>Transaksi</button>
      <button
        onClick={() =>
          createGoal.mutate({ name: 'Liburan', wallet_id: 'w1', target_amount: 2_000_000, deadline: '2027-01-31' })
        }
      >
        Buat target
      </button>
    </div>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('goals api', () => {
  it('useGoals fetches goals and returns data', async () => {
    routeFetch({ '/api/proxy/goals': () => jsonResponse(200, { data: [goal] }) });
    renderWithClient(<Probe />);
    expect(await screen.findByText('goals 1')).toBeInTheDocument();
  });

  it('creating a transaction refetches goals', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({
      '/api/proxy/goals': () => jsonResponse(200, { data: [goal] }),
      '/api/proxy/transactions': () => jsonResponse(201, { data: {} }),
      '/api/proxy/wallets': () => jsonResponse(200, { data: [] }),
      '/api/proxy/dashboard': () => jsonResponse(200, { data: {} }),
    });
    renderWithClient(<Probe />);
    await screen.findByText('goals 1');

    await user.click(screen.getByRole('button', { name: 'Transaksi' }));

    await waitFor(() => expect(fetchedUrls(mock).filter((u) => u === '/api/proxy/goals')).toHaveLength(2));
  });

  it('useCreateGoal POSTs goals with a JSON body and refreshes goals', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({
      '/api/proxy/goals': (init) =>
        init.method === 'POST' ? jsonResponse(201, { data: goal }) : jsonResponse(200, { data: [] }),
    });
    renderWithClient(<Probe />);
    await screen.findByText('goals 0');

    await user.click(screen.getByRole('button', { name: 'Buat target' }));

    await waitFor(() => expect(fetchedUrls(mock).filter((u) => u === '/api/proxy/goals')).toHaveLength(3));
    const post = mock.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(String(post?.[0])).toBe('/api/proxy/goals');
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      name: 'Liburan',
      wallet_id: 'w1',
      target_amount: 2_000_000,
      deadline: '2027-01-31',
    });
  });
});
