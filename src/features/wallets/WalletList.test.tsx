import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, stubFetch } from '@/test/utils';
import { WalletList } from './WalletList';

const wallet = (over = {}) => ({
  id: 'w1', name: 'BCA', type: 'bank', initial_balance: 0, currency: 'IDR', is_archived: false, balance: 1500000, ...over,
});

afterEach(() => vi.unstubAllGlobals());

describe('WalletList', () => {
  it('shows a skeleton while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderWithClient(<WalletList onEdit={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Memuat dompet' })).toBeInTheDocument();
  });

  it('lists wallets with formatted balances and an archived badge', async () => {
    stubFetch(jsonResponse(200, { data: [wallet(), wallet({ id: 'w2', name: 'Lama', is_archived: true, balance: 0 })] }));
    renderWithClient(<WalletList onEdit={vi.fn()} />);

    expect(await screen.findByText('BCA')).toBeInTheDocument();
    expect(screen.getByText('Rp 1.500.000')).toBeInTheDocument();
    expect(screen.getByText('Diarsipkan')).toBeInTheDocument();
  });

  it('shows a friendly empty state', async () => {
    stubFetch(jsonResponse(200, { data: [] }));
    renderWithClient(<WalletList onEdit={vi.fn()} />);

    expect(await screen.findByText('Belum ada dompet')).toBeInTheDocument();
  });

  it('shows an error with a retry when loading fails', async () => {
    stubFetch(jsonResponse(500, { message: 'Server error' }));
    renderWithClient(<WalletList onEdit={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server error');
  });

  it('archives through PATCH and refreshes the list', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse(200, { data: [wallet()] }),
      jsonResponse(200, { data: wallet({ is_archived: true }) }),
      jsonResponse(200, { data: [wallet({ is_archived: true })] }),
    );
    renderWithClient(<WalletList onEdit={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Arsipkan BCA' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe('/api/proxy/wallets/w1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ is_archived: true });
    expect(await screen.findByRole('button', { name: 'Aktifkan BCA' })).toBeInTheDocument();
  });

  it('deletes after confirmation and not when cancelled', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse(200, { data: [wallet()] }),
      new Response(null, { status: 204 }),
      jsonResponse(200, { data: [] }),
    );
    renderWithClient(<WalletList onEdit={vi.fn()} />);
    const button = await screen.findByRole('button', { name: 'Hapus BCA' });

    vi.stubGlobal('confirm', () => false);
    await user.click(button);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.stubGlobal('confirm', () => true);
    await user.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect((fetchMock.mock.calls[1] as [string, RequestInit])[1].method).toBe('DELETE');
    expect(await screen.findByText('Belum ada dompet')).toBeInTheDocument();
  });

  it('calls onEdit with the wallet', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    stubFetch(jsonResponse(200, { data: [wallet()] }));
    renderWithClient(<WalletList onEdit={onEdit} />);

    await user.click(await screen.findByRole('button', { name: 'Ubah BCA' }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'w1', name: 'BCA' }));
  });
});
