import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { useTransactions } from '@/features/transactions/api';
import { receiptUrl, scanReceipt, useDeleteReceipt, useUploadReceipt } from './api';

const file = new File(['abc'], 'struk.jpg', { type: 'image/jpeg' });

afterEach(() => vi.unstubAllGlobals());

describe('receipts api', () => {
  it('receiptUrl menunjuk ke proxy', () => {
    expect(receiptUrl('t1')).toBe('/api/proxy/transactions/t1/receipt');
  });

  it('scanReceipt mengirim FormData dan mengembalikan data', async () => {
    const suggestion = { total: 25000, date: '2026-11-20', merchant: 'Toko', category_id: null };
    const mock = routeFetch({ '/api/proxy/receipts/scan': () => jsonResponse(200, { data: suggestion }) });
    expect(await scanReceipt(file)).toEqual(suggestion);
    const init = mock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('image')).toBeInstanceOf(File);
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
  });

  it('upload dan hapus struk memanggil URL benar dan menyegarkan transactions', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({
      '/api/proxy/transactions': (init) =>
        init.method === 'POST' || init.method === 'DELETE' ? jsonResponse(init.method === 'DELETE' ? 204 : 201, init.method === 'DELETE' ? undefined : { data: {} }) : jsonResponse(200, { data: [], meta: { next_cursor: null } }),
    });
    function Probe() {
      const list = useTransactions({});
      const up = useUploadReceipt();
      const del = useDeleteReceipt();
      return (
        <div>
          <span>{list.data ? 'loaded' : 'loading'}</span>
          <button onClick={() => up.mutate({ id: 't1', file })}>Unggah</button>
          <button onClick={() => del.mutate({ id: 't1' })}>Hapus</button>
        </div>
      );
    }
    renderWithClient(<Probe />);
    await screen.findByText('loaded');
    const base = mock.mock.calls.length;
    await user.click(screen.getByText('Unggah'));
    await waitFor(() => expect(mock.mock.calls.length).toBeGreaterThanOrEqual(base + 2));
    const calls = mock.mock.calls.map(([u, i]) => `${(i as RequestInit)?.method ?? 'GET'} ${u}`);
    expect(calls).toContain('POST /api/proxy/transactions/t1/receipt');
    const afterUpload = mock.mock.calls.length;
    await user.click(screen.getByText('Hapus'));
    await waitFor(() => expect(mock.mock.calls.length).toBeGreaterThanOrEqual(afterUpload + 2));
    expect(mock.mock.calls.map(([u, i]) => `${(i as RequestInit)?.method ?? 'GET'} ${u}`)).toContain('DELETE /api/proxy/transactions/t1/receipt');
  });
});
