import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { TrendTab } from './TrendTab';

const point = (month: string, income: number, expense: number) => ({ month, income, expense, net: income - expense });

afterEach(() => vi.unstubAllGlobals());

describe('TrendTab', () => {
  it('loads 6 months by default and shows the chart', async () => {
    const fetchMock = routeFetch({ '/api/proxy/reports/monthly-trend': () => jsonResponse(200, { data: [point('2026-11', 100000, 40000)] }) });
    renderWithClient(<TrendTab />);

    expect(await screen.findByRole('table', { name: /tren bulanan/i })).toBeInTheDocument();
    expect(fetchedUrls(fetchMock)).toEqual(['/api/proxy/reports/monthly-trend?months=6']);
    expect(screen.getByRole('radio', { name: '6 bulan' })).toBeChecked();
  });

  it('switches to 12 months', async () => {
    const fetchMock = routeFetch({ '/api/proxy/reports/monthly-trend': () => jsonResponse(200, { data: [point('2026-11', 1, 1)] }) });
    renderWithClient(<TrendTab />);
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('radio', { name: '12 bulan' }));

    await waitFor(() => expect(fetchedUrls(fetchMock)).toContain('/api/proxy/reports/monthly-trend?months=12'));
    expect(screen.getByRole('radio', { name: '12 bulan' })).toBeChecked();
  });

  it('shows an empty state when no month has transactions', async () => {
    routeFetch({ '/api/proxy/reports/monthly-trend': () => jsonResponse(200, { data: [point('2026-10', 0, 0), point('2026-11', 0, 0)] }) });
    renderWithClient(<TrendTab />);

    expect(await screen.findByText('Belum ada transaksi pada periode ini')).toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    let calls = 0;
    routeFetch({
      '/api/proxy/reports/monthly-trend': () => (++calls === 1 ? jsonResponse(500, { message: 'Server error' }) : jsonResponse(200, { data: [point('2026-11', 5, 1)] })),
    });
    renderWithClient(<TrendTab />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
