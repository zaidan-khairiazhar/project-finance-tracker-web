import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import type { Transaction } from '@/features/transactions/api';
import { ReceiptSection } from './ReceiptSection';
import { ReceiptViewerDialog } from './ReceiptViewerDialog';

const compressed = new File(['small'], 'struk.jpg', { type: 'image/jpeg' });
vi.mock('@/lib/image', () => ({ compressImage: vi.fn(async () => compressed) }));
import { compressImage } from '@/lib/image';

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't1', wallet_id: 'w1', category_id: null, type: 'expense', amount: 25000,
  occurred_at: '2026-11-07T16:30:00Z', note: 'kopi susu', transfer_group_id: null, recurring_rule_id: null, has_receipt: false, ...over,
});
const picked = new File(['big'], 'foto.png', { type: 'image/png' });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('ReceiptSection', () => {
  it('tanpa struk: memilih file mengompres lalu mengunggah, dan bagian beralih ke keadaan punya struk', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({ '/api/proxy/transactions/t1/receipt': () => jsonResponse(200, { data: {} }) });
    const { container } = renderWithClient(<ReceiptSection transaction={tx()} />);

    expect(screen.getByRole('button', { name: 'Tambah foto struk' })).toBeInTheDocument();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/*');
    await user.upload(input, picked);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Hapus foto' })).toBeInTheDocument());
    expect(compressImage).toHaveBeenCalledWith(picked);
    const init = mock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(((init.body as FormData).get('image') as File).name).toBe('struk.jpg');
    expect(screen.getByRole('img', { name: 'Struk kopi susu' }).getAttribute('src')).toContain('/api/proxy/transactions/t1/receipt');
    expect(screen.getByRole('button', { name: 'Ganti foto' })).toBeInTheDocument();
  });

  it('menampilkan "Mengunggah…" dan menonaktifkan tombol saat unggah berjalan', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { container } = renderWithClient(<ReceiptSection transaction={tx()} />);
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, picked);

    expect(await screen.findByText('Mengunggah…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tambah foto struk|Mengunggah/ })).toBeDisabled();
  });

  it('galat unggah tampil di role=alert dan keadaan tidak berubah', async () => {
    const user = userEvent.setup();
    routeFetch({ '/api/proxy/transactions/t1/receipt': () => jsonResponse(422, { message: 'Berkas bukan gambar.' }) });
    const { container } = renderWithClient(<ReceiptSection transaction={tx()} />);
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, picked);

    expect(await screen.findByRole('alert')).toHaveTextContent('Berkas bukan gambar.');
    expect(screen.getByRole('button', { name: 'Tambah foto struk' })).toBeInTheDocument();
  });

  it('dengan struk: gambar kecil, Ganti foto, dan Hapus foto yang meminta konfirmasi', async () => {
    const user = userEvent.setup();
    const mock = routeFetch({ '/api/proxy/transactions/t1/receipt': () => jsonResponse(204) });
    const confirmMock = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal('confirm', confirmMock);
    renderWithClient(<ReceiptSection transaction={tx({ has_receipt: true })} />);

    expect(screen.getByRole('img', { name: 'Struk kopi susu' }).getAttribute('src')).toContain('/api/proxy/transactions/t1/receipt');
    expect(screen.getByRole('button', { name: 'Ganti foto' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hapus foto' }));
    expect(mock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Hapus foto' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tambah foto struk' })).toBeInTheDocument());
    expect((mock.mock.calls[0][1] as RequestInit).method).toBe('DELETE');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('galat hapus tampil di role=alert dan struk tetap ada', async () => {
    const user = userEvent.setup();
    routeFetch({ '/api/proxy/transactions/t1/receipt': () => jsonResponse(500, { message: 'Gagal menghapus.' }) });
    vi.stubGlobal('confirm', vi.fn(() => true));
    renderWithClient(<ReceiptSection transaction={tx({ has_receipt: true, note: null })} />);

    expect(screen.getByRole('img', { name: 'Struk transaksi' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hapus foto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Gagal menghapus.');
    expect(screen.getByRole('button', { name: 'Hapus foto' })).toBeInTheDocument();
  });

  it('mengganti foto menambah kunci cache pada src gambar', async () => {
    const user = userEvent.setup();
    routeFetch({ '/api/proxy/transactions/t1/receipt': () => jsonResponse(200, { data: {} }) });
    const { container } = renderWithClient(<ReceiptSection transaction={tx({ has_receipt: true })} />);
    const before = screen.getByRole('img', { name: 'Struk kopi susu' }).getAttribute('src');
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, picked);

    await waitFor(() => expect(screen.getByRole('img', { name: 'Struk kopi susu' }).getAttribute('src')).not.toBe(before));
    expect(screen.getByRole('img', { name: 'Struk kopi susu' }).getAttribute('src')).toMatch(/\?v=\d+$/);
  });
});

describe('ReceiptViewerDialog', () => {
  it('menampilkan gambar struk dan tombol tutup', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithClient(<ReceiptViewerDialog transaction={tx({ has_receipt: true })} onClose={onClose} />);

    expect(screen.getByRole('img', { name: 'Struk kopi susu' })).toHaveAttribute('src', '/api/proxy/transactions/t1/receipt');
    await user.click(screen.getByRole('button', { name: 'Tutup' }));
    expect(onClose).toHaveBeenCalled();
  });
});
