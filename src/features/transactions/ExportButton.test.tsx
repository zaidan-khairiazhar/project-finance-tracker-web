import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, routeFetch, fetchedUrls } from '@/test/utils';
import * as download from '@/lib/download';
import { ExportButton } from './ExportButton';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const csv = () =>
  new Response('Tanggal\n2026-11-01\n', {
    status: 200,
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="transaksi-20261111.csv"' },
  });

describe('ExportButton', () => {
  it('downloads the CSV using the server filename', async () => {
    routeFetch({ '/api/proxy/transactions/export': () => csv() });
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    render(<ExportButton filters={{}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }));

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][1]).toBe('transaksi-20261111.csv');
    expect(save.mock.calls[0][0].size).toBeGreaterThan(0);
    expect(save.mock.calls[0][0].type).toBe('text/csv');
  });

  it('sends the active filters but not pagination', async () => {
    const fetchMock = routeFetch({ '/api/proxy/transactions/export': () => csv() });
    vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    render(<ExportButton filters={{ type: 'expense', from: '2026-11-01', q: 'kopi', per_page: 20 }} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchedUrls(fetchMock)).toEqual(['/api/proxy/transactions/export?type=expense&from=2026-11-01&q=kopi']);
  });

  it('is disabled while exporting', async () => {
    let release: (r: Response) => void = () => {};
    routeFetch({ '/api/proxy/transactions/export': () => new Promise<Response>((r) => (release = r)) as unknown as Response });
    vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    render(<ExportButton filters={{}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }));

    expect(await screen.findByRole('button', { name: 'Mengekspor…' })).toBeDisabled();
    release(csv());
    expect(await screen.findByRole('button', { name: 'Ekspor CSV' })).toBeEnabled();
  });

  it('shows the server message when the export is refused', async () => {
    routeFetch({ '/api/proxy/transactions/export': () => jsonResponse(422, { message: 'Terlalu banyak baris. Persempit filter.' }) });
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    render(<ExportButton filters={{}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Terlalu banyak baris. Persempit filter.');
    expect(save).not.toHaveBeenCalled();
  });

  it('falls back to a default filename', async () => {
    routeFetch({ '/api/proxy/transactions/export': () => new Response('x', { status: 200, headers: { 'Content-Type': 'text/csv' } }) });
    const save = vi.spyOn(download, 'downloadFile').mockImplementation(() => {});
    render(<ExportButton filters={{}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Ekspor CSV' }));

    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][1]).toBe('transaksi.csv');
  });
});
