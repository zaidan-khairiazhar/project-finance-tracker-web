import { useQuery } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { useRunRecurring } from './api';

function Probe() {
  const tx = useQuery({ queryKey: ['transactions'], queryFn: () => api<{ data: unknown[] }>('transactions') });
  const run = useRunRecurring();
  return (
    <div>
      <span>{tx.data ? 'loaded' : 'loading'}</span>
      <button onClick={() => run.mutate()}>Jalankan</button>
      {run.data && <span>dibuat {run.data.created}</span>}
    </div>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('useRunRecurring', () => {
  it('POSTs to recurring-rules/run and refreshes transactions afterwards', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({
      '/api/proxy/transactions': () => jsonResponse(200, { data: [] }),
      '/api/proxy/recurring-rules/run': () => jsonResponse(200, { created: 3 }),
    });
    renderWithClient(<Probe />);
    await screen.findByText('loaded');

    await user.click(screen.getByRole('button', { name: 'Jalankan' }));

    expect(await screen.findByText('dibuat 3')).toBeInTheDocument();
    const run = mock.mock.calls.find(([u]) => String(u) === '/api/proxy/recurring-rules/run');
    expect(run?.[1]?.method).toBe('POST');
    await waitFor(() => expect(fetchedUrls(mock).filter((u) => u === '/api/proxy/transactions')).toHaveLength(2));
  });
});
