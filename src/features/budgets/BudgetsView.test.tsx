import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { BudgetsView } from './BudgetsView';

const serve = () =>
  routeFetch({
    '/api/proxy/budgets': () => jsonResponse(200, { data: [] }),
    '/api/proxy/categories': () => jsonResponse(200, { data: [{ id: 'c1', parent_id: null, name: 'Makanan', type: 'expense', icon: null, color: null }] }),
  });

afterEach(() => vi.unstubAllGlobals());

describe('BudgetsView', () => {
  it('loads the initial month and refetches when the month changes', async () => {
    const user = userEvent.setup();
    const mock = serve();
    renderWithClient(<BudgetsView initialMonth="2026-11" currentMonth="2026-11" />);

    await screen.findByText('Belum ada anggaran');
    expect(fetchedUrls(mock)).toContain('/api/proxy/budgets?month=2026-11');

    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }));

    await waitFor(() => expect(fetchedUrls(mock)).toContain('/api/proxy/budgets?month=2026-10'));
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument();
  });

  it('opens the form from "Atur anggaran"', async () => {
    const user = userEvent.setup();
    serve();
    renderWithClient(<BudgetsView initialMonth="2026-11" currentMonth="2026-11" />);

    await user.click(await screen.findByRole('button', { name: 'Atur anggaran' }));

    expect(await screen.findByRole('dialog', { name: 'Atur anggaran' })).toBeInTheDocument();
    expect(screen.getByLabelText('Batas per bulan (Rp)')).toBeInTheDocument();
  });
});
