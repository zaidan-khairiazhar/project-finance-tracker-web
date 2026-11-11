import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { WalletTab } from './WalletTab';

const wallet = (over: object) => ({
  wallet_id: 'w1', name: 'BCA', is_archived: false, income: 5000000, expense: 1200000, transfer_in: 300000, transfer_out: 100000, closing_balance: 4000000, ...over,
});
const stub = (data: object[]) => routeFetch({ '/api/proxy/reports/wallets': () => jsonResponse(200, { data }) });

afterEach(() => vi.unstubAllGlobals());

describe('WalletTab', () => {
  it('requests the current month by default', async () => {
    const fetchMock = stub([wallet({})]);
    renderWithClient(<WalletTab now={new Date('2026-11-11T05:00:00Z')} />);

    await screen.findByRole('table', { name: /ringkasan per dompet/i });
    expect(fetchedUrls(fetchMock)).toEqual(['/api/proxy/reports/wallets?from=2026-11-01&to=2026-11-30']);
  });

  it('lists each wallet with flows and closing balance', async () => {
    stub([wallet({}), wallet({ wallet_id: 'w2', name: 'Tunai', income: 0, expense: 50000, transfer_in: 0, transfer_out: 0, closing_balance: 250000 })]);
    renderWithClient(<WalletTab now={new Date('2026-11-11T05:00:00Z')} />);

    const table = await screen.findByRole('table', { name: /ringkasan per dompet/i });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('BCA')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 5.000.000')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 1.200.000')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 4.000.000')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Rp 250.000')).toBeInTheDocument();
  });

  it('labels archived wallets with text', async () => {
    stub([wallet({ is_archived: true, name: 'Lama' })]);
    renderWithClient(<WalletTab now={new Date('2026-11-11T05:00:00Z')} />);

    expect(await screen.findByText('Diarsipkan')).toBeInTheDocument();
  });

  it('refetches when the range changes', async () => {
    const fetchMock = stub([wallet({})]);
    renderWithClient(<WalletTab now={new Date('2026-11-11T05:00:00Z')} />);
    await screen.findByRole('table');

    const from = screen.getByLabelText('Dari');
    await userEvent.clear(from);
    await userEvent.type(from, '2026-10-01');

    await waitFor(() => expect(fetchedUrls(fetchMock)).toContain('/api/proxy/reports/wallets?from=2026-10-01&to=2026-11-30'));
  });

  it('shows an empty state without wallets', async () => {
    stub([]);
    renderWithClient(<WalletTab now={new Date('2026-11-11T05:00:00Z')} />);

    expect(await screen.findByText('Belum ada dompet untuk dilaporkan')).toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    let calls = 0;
    routeFetch({ '/api/proxy/reports/wallets': () => (++calls === 1 ? jsonResponse(500, { message: 'Server error' }) : jsonResponse(200, { data: [wallet({})] })) });
    renderWithClient(<WalletTab now={new Date('2026-11-11T05:00:00Z')} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
