import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, routeFetch } from '@/test/utils';
import { ReceiptScanFlow } from './ReceiptScanFlow';

const compressed = new File(['small'], 'struk.jpg', { type: 'image/jpeg' });
vi.mock('@/lib/image', () => ({ compressImage: vi.fn(async () => compressed) }));
import { compressImage } from '@/lib/image';

const picked = new File(['big'], 'foto.png', { type: 'image/png' });
const wallet = { id: 'w1', name: 'Kas', type: 'cash', initial_balance: 0, currency: 'IDR', is_archived: false, balance: 0 };
const cat = { id: 'c1', parent_id: null, name: 'Makanan', type: 'expense', icon: null, color: null };
const suggestion = { total: 45000, date: '2026-11-10', merchant: 'Warung Bu Tini', category_id: 'c1' };
const FAIL_TEXT = 'Tidak bisa membaca struk otomatis, isi manual.';

type Opts = { scan?: () => Response; upload?: () => Response };
const serve = ({ scan = () => jsonResponse(200, { data: suggestion }), upload = () => jsonResponse(200, { data: {} }) }: Opts = {}) =>
  routeFetch({
    '/api/proxy/receipts/scan': scan,
    '/api/proxy/transactions/t1/receipt': upload,
    '/api/proxy/transactions': () => jsonResponse(201, { data: { id: 't1' } }),
    '/api/proxy/wallets': () => jsonResponse(200, { data: [wallet] }),
    '/api/proxy/categories': () => jsonResponse(200, { data: [cat] }),
  });

const calls = (mock: ReturnType<typeof serve>, url: string, method = 'POST') =>
  mock.mock.calls.filter(([u, init]) => String(u) === url && (init as RequestInit)?.method === method);

async function pick(container: HTMLElement, user = userEvent.setup()) {
  await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, picked);
  return user;
}

beforeEach(() => {
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('ReceiptScanFlow', () => {
  it('input file tersembunyi memakai kamera belakang', () => {
    serve();
    const { container } = renderWithClient(<ReceiptScanFlow />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('capture', 'environment');
    expect(screen.getByRole('button', { name: 'Scan struk' })).toBeInTheDocument();
  });

  it('scan berhasil: status dibaca, lalu dialog terisi dengan pratinjau', async () => {
    serve();
    const { container } = renderWithClient(<ReceiptScanFlow />);
    await pick(container);

    const dialog = await screen.findByRole('dialog', { name: 'Tambah transaksi dari struk' });
    expect(dialog).toBeInTheDocument();
    expect(compressImage).toHaveBeenCalledWith(picked);
    expect(await screen.findByLabelText('Jumlah (Rp)')).toHaveValue('45.000');
    expect(screen.getByLabelText('Catatan')).toHaveValue('Warung Bu Tini');
    await waitFor(() => expect(screen.getByLabelText('Kategori')).toHaveValue('c1'));
    expect(screen.getByLabelText('Waktu (WIB)')).toHaveValue('2026-11-10T12:00');
    expect(screen.getByRole('img', { name: 'Foto struk' })).toHaveAttribute('src', 'blob:preview');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('menampilkan "Membaca struk…" selama scan berjalan', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { container } = renderWithClient(<ReceiptScanFlow />);
    await pick(container);
    expect(await screen.findByRole('status')).toHaveTextContent('Membaca struk…');
  });

  it('Simpan: POST transactions lalu POST transactions/{id}/receipt, lalu dialog menutup', async () => {
    const mock = serve();
    const { container } = renderWithClient(<ReceiptScanFlow />);
    const user = await pick(container);
    await screen.findByDisplayValue('Warung Bu Tini');
    await waitFor(() => expect(screen.getByLabelText('Dompet')).toHaveValue('w1'));
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const posts = mock.mock.calls.filter(([, init]) => (init as RequestInit)?.method === 'POST').map(([u]) => String(u));
    expect(posts).toEqual(['/api/proxy/receipts/scan', '/api/proxy/transactions', '/api/proxy/transactions/t1/receipt']);
    const upload = calls(mock, '/api/proxy/transactions/t1/receipt')[0][1] as RequestInit;
    expect(((upload.body as FormData).get('image') as File).name).toBe('struk.jpg');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it.each([503, 502])('scan %i: form kosong, pesan, dan tetap bisa disimpan beserta foto', async (status) => {
    const mock = serve({ scan: () => jsonResponse(status, { message: 'gagal' }) });
    const { container } = renderWithClient(<ReceiptScanFlow />);
    const user = await pick(container);

    expect(await screen.findByRole('alert')).toHaveTextContent(FAIL_TEXT);
    expect(screen.getByLabelText('Jumlah (Rp)')).toHaveValue('');
    expect(screen.getByLabelText('Catatan')).toHaveValue('');
    expect(screen.getByRole('img', { name: 'Foto struk' })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByLabelText('Dompet')).toHaveValue('w1'));
    await user.type(screen.getByLabelText('Jumlah (Rp)'), '12000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls(mock, '/api/proxy/transactions')).toHaveLength(1);
    expect(calls(mock, '/api/proxy/transactions/t1/receipt')).toHaveLength(1);
  });

  it('unggah gagal: pesan; "Coba unggah lagi" hanya mengulang unggah; form tak bisa membuat transaksi kedua', async () => {
    let attempts = 0;
    const mock = serve({ upload: () => (++attempts === 1 ? jsonResponse(500, { message: 'x' }) : jsonResponse(200, { data: {} })) });
    const { container } = renderWithClient(<ReceiptScanFlow />);
    const user = await pick(container);
    await screen.findByDisplayValue('Warung Bu Tini');
    await waitFor(() => expect(screen.getByLabelText('Dompet')).toHaveValue('w1'));
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Transaksi tersimpan, tetapi foto struk gagal diunggah.');
    expect(screen.queryByRole('button', { name: 'Simpan' })).not.toBeInTheDocument();
    expect(calls(mock, '/api/proxy/transactions')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Coba unggah lagi' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls(mock, '/api/proxy/transactions')).toHaveLength(1);
    expect(calls(mock, '/api/proxy/transactions/t1/receipt')).toHaveLength(2);
  });

  it('"Lewati" menutup dialog setelah unggah gagal', async () => {
    serve({ upload: () => jsonResponse(500, { message: 'x' }) });
    const { container } = renderWithClient(<ReceiptScanFlow />);
    const user = await pick(container);
    await screen.findByDisplayValue('Warung Bu Tini');
    await waitFor(() => expect(screen.getByLabelText('Dompet')).toHaveValue('w1'));
    await user.click(screen.getByRole('button', { name: 'Simpan' }));
    await screen.findByRole('button', { name: 'Lewati' });
    await user.click(screen.getByRole('button', { name: 'Lewati' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('Batal menutup dan mereset; memilih lagi memulai dari awal', async () => {
    serve();
    const { container } = renderWithClient(<ReceiptScanFlow />);
    const user = await pick(container);
    await screen.findByDisplayValue('Warung Bu Tini');
    await user.click(screen.getByRole('button', { name: 'Batal' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('compressImage gagal (mengembalikan file asli): file asli yang dikirim', async () => {
    vi.mocked(compressImage).mockResolvedValueOnce(picked);
    const mock = serve();
    const { container } = renderWithClient(<ReceiptScanFlow />);
    await pick(container);
    await screen.findByRole('dialog');
    const init = calls(mock, '/api/proxy/receipts/scan')[0][1] as RequestInit;
    expect((init.body as FormData).get('image')).toBe(picked);
  });
});
