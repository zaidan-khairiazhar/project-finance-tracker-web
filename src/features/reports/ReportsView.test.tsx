import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { ReportsView } from './ReportsView';

afterEach(() => vi.unstubAllGlobals());

describe('ReportsView', () => {
  it('links the three tabs with ?tab=', () => {
    routeFetch({ '/api/proxy/reports': () => jsonResponse(200, { data: [] }) });
    renderWithClient(<ReportsView tab="trend" />);

    const tabs = screen.getByRole('tablist', { name: 'Jenis laporan' });
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tren' })).toHaveAttribute('href', '/reports?tab=trend');
    expect(screen.getByRole('tab', { name: 'Kategori' })).toHaveAttribute('href', '/reports?tab=category');
    expect(screen.getByRole('tab', { name: 'Dompet' })).toHaveAttribute('href', '/reports?tab=wallets');
  });

  it('marks the active tab', () => {
    routeFetch({ '/api/proxy/reports': () => jsonResponse(200, { data: [] }) });
    renderWithClient(<ReportsView tab="trend" />);

    expect(screen.getByRole('tab', { name: 'Tren' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Kategori' })).toHaveAttribute('aria-selected', 'false');
  });

  it('falls back to Tren for an unknown tab', () => {
    routeFetch({ '/api/proxy/reports': () => jsonResponse(200, { data: [] }) });
    renderWithClient(<ReportsView tab="bogus" />);

    expect(screen.getByRole('tab', { name: 'Tren' })).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to Tren when there is no tab', () => {
    routeFetch({ '/api/proxy/reports': () => jsonResponse(200, { data: [] }) });
    renderWithClient(<ReportsView tab={undefined} />);

    expect(screen.getByRole('tab', { name: 'Tren' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the category and wallet tabs', async () => {
    routeFetch({
      '/api/proxy/reports/category-comparison': () => jsonResponse(200, { data: { months: [], rows: [] } }),
      '/api/proxy/reports/wallets': () => jsonResponse(200, { data: [] }),
    });
    const category = renderWithClient(<ReportsView tab="category" />);
    expect(await screen.findByText('Belum ada pengeluaran pada periode ini')).toBeInTheDocument();
    category.unmount();

    renderWithClient(<ReportsView tab="wallets" />);
    expect(await screen.findByText('Belum ada dompet untuk dilaporkan')).toBeInTheDocument();
  });
});
