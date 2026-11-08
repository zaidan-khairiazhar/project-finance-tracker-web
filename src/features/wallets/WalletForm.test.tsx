import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, stubFetch } from '@/test/utils';
import { WalletForm } from './WalletForm';

afterEach(() => vi.unstubAllGlobals());

describe('WalletForm', () => {
  it('sends the parsed balance as a plain integer', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const fetchMock = stubFetch(jsonResponse(201, { data: {} }), jsonResponse(200, { data: [] }));
    renderWithClient(<WalletForm onDone={onDone} />);

    await user.type(screen.getByLabelText('Nama dompet'), 'BCA');
    await user.type(screen.getByLabelText('Saldo awal (Rp)'), '1.500.000');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/proxy/wallets');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'BCA', type: 'bank', initial_balance: 1500000 });
  });

  it('rejects a decimal balance without calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();
    renderWithClient(<WalletForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Nama dompet'), 'BCA');
    await user.type(screen.getByLabelText('Saldo awal (Rp)'), '12,5');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText(/angka bulat/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a 422 from the API onto the field', async () => {
    const user = userEvent.setup();
    stubFetch(jsonResponse(422, { message: 'x', errors: { name: ['Nama sudah dipakai.'] } }));
    renderWithClient(<WalletForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Nama dompet'), 'BCA');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Nama sudah dipakai.')).toBeInTheDocument();
  });
});
