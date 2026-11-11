import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedUrls, jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { CategoryTab } from './CategoryTab';

const payload = {
  months: ['2026-09', '2026-10', '2026-11'],
  rows: [
    { category_id: 'a', name: 'Makanan', totals: [300000, 500000, 200000], total: 1000000 },
    { category_id: null, name: 'Tanpa kategori', totals: [0, 0, 250000], total: 250000 },
  ],
};
const stub = () => routeFetch({ '/api/proxy/reports/category-comparison': () => jsonResponse(200, { data: payload }) });

afterEach(() => vi.unstubAllGlobals());

describe('CategoryTab', () => {
  it('loads 6 months of expenses by default', async () => {
    const fetchMock = stub();
    renderWithClient(<CategoryTab />);

    await screen.findByRole('table', { name: /kategori per bulan/i });
    expect(fetchedUrls(fetchMock)).toEqual(['/api/proxy/reports/category-comparison?months=6&type=expense']);
  });

  it('shows one table row per category with monthly amounts and total', async () => {
    stub();
    renderWithClient(<CategoryTab />);

    const table = await screen.findByRole('table', { name: /kategori per bulan/i });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(table).getByRole('columnheader', { name: 'Sep 2026' })).toBeInTheDocument();
    expect(within(rows[1]).getByText('Makanan')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 500.000')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 1.000.000')).toBeInTheDocument();
  });

  it('ranks categories by period total as horizontal bars', async () => {
    stub();
    renderWithClient(<CategoryTab />);

    const makanan = await screen.findByRole('meter', { name: 'Makanan' });
    const none = screen.getByRole('meter', { name: 'Tanpa kategori' });
    expect(makanan.firstElementChild).toHaveStyle({ width: '100%' });
    expect(none.firstElementChild).toHaveStyle({ width: '25%' });
  });

  it('switches to income', async () => {
    const fetchMock = stub();
    renderWithClient(<CategoryTab />);
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('radio', { name: 'Pemasukan' }));

    await waitFor(() => expect(fetchedUrls(fetchMock)).toContain('/api/proxy/reports/category-comparison?months=6&type=income'));
  });

  it('changes the number of months', async () => {
    const fetchMock = stub();
    renderWithClient(<CategoryTab />);
    await screen.findByRole('table');

    await userEvent.selectOptions(screen.getByLabelText('Jumlah bulan'), '12');

    await waitFor(() => expect(fetchedUrls(fetchMock)).toContain('/api/proxy/reports/category-comparison?months=12&type=expense'));
  });

  it('offers 3 to 12 months', async () => {
    stub();
    renderWithClient(<CategoryTab />);
    await screen.findByRole('table');

    const options = within(screen.getByLabelText('Jumlah bulan')).getAllByRole('option');
    expect(options.map((o) => o.getAttribute('value'))).toEqual(['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  });

  it('shows an empty state without transactions', async () => {
    routeFetch({ '/api/proxy/reports/category-comparison': () => jsonResponse(200, { data: { months: ['2026-11'], rows: [] } }) });
    renderWithClient(<CategoryTab />);

    expect(await screen.findByText('Belum ada pengeluaran pada periode ini')).toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    let calls = 0;
    routeFetch({
      '/api/proxy/reports/category-comparison': () => (++calls === 1 ? jsonResponse(500, { message: 'Server error' }) : jsonResponse(200, { data: payload })),
    });
    renderWithClient(<CategoryTab />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
    await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
