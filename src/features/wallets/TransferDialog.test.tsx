import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient } from '@/test/utils';
import { TransferDialog } from './TransferDialog';

const wallets = [
  { id: 'w1', name: 'BCA', type: 'bank', is_archived: false, balance: 1000000 },
  { id: 'w2', name: 'Tunai', type: 'cash', is_archived: false, balance: 0 },
  { id: 'w3', name: 'Lama', type: 'bank', is_archived: true, balance: 0 },
];

function setup(handler: (url: string, init?: RequestInit) => Response) {
  const mock = vi.fn(async (url: string, init?: RequestInit) =>
    url.startsWith('/api/proxy/wallets') ? jsonResponse(200, { data: wallets }) : handler(url, init),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => vi.unstubAllGlobals());

describe('TransferDialog', () => {
  it('sends a transfer between two different active wallets', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const mock = setup(() => jsonResponse(201, { data: {} }));
    renderWithClient(<TransferDialog open onClose={onClose} />);

    await waitFor(() => expect(screen.getByLabelText('Dari dompet')).toHaveValue('w1'));
    expect(screen.queryByRole('option', { name: /Lama/ })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Ke dompet'), 'w2');
    await user.type(screen.getByLabelText(/jumlah/i), '250.000');
    await user.click(screen.getByRole('button', { name: 'Transfer' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [, init] = mock.mock.calls.find(([u]) => u === '/api/proxy/transfers') as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ from_wallet_id: 'w1', to_wallet_id: 'w2', amount: 250000, note: null });
  });

  it('refuses the same wallet on both sides without calling the API', async () => {
    const user = userEvent.setup();
    const mock = setup(() => jsonResponse(201, { data: {} }));
    renderWithClient(<TransferDialog open onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText('Dari dompet')).toHaveValue('w1'));
    await user.selectOptions(screen.getByLabelText('Ke dompet'), 'w1');
    await user.type(screen.getByLabelText(/jumlah/i), '1000');
    await user.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(await screen.findByText('Dompet tujuan harus berbeda dari dompet asal.')).toBeInTheDocument();
    expect(mock.mock.calls.some(([u]) => u === '/api/proxy/transfers')).toBe(false);
  });

  it('shows API validation errors on the field', async () => {
    const user = userEvent.setup();
    setup(() => jsonResponse(422, { message: 'x', errors: { from_wallet_id: ['Dompet sudah diarsipkan.'] } }));
    renderWithClient(<TransferDialog open onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText('Dari dompet')).toHaveValue('w1'));
    await user.selectOptions(screen.getByLabelText('Ke dompet'), 'w2');
    await user.type(screen.getByLabelText(/jumlah/i), '1000');
    await user.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(await screen.findByText('Dompet sudah diarsipkan.')).toBeInTheDocument();
  });
});
