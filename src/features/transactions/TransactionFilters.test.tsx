import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient } from '@/test/utils';
import { TransactionFilters } from './TransactionFilters';

vi.stubGlobal('fetch', vi.fn(async (url: string) =>
  jsonResponse(200, { data: url.includes('wallets') ? [{ id: 'w1', name: 'BCA' }] : [{ id: 'c1', parent_id: null, name: 'Makanan' }] }),
));
afterEach(() => vi.clearAllMocks());

describe('TransactionFilters', () => {
  it('reports a wallet choice and drops empty keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithClient(<TransactionFilters value={{}} onChange={onChange} />);

    await waitFor(() => expect(screen.getByRole('option', { name: 'BCA' })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText('Dompet'), 'w1');

    expect(onChange).toHaveBeenLastCalledWith({ wallet_id: 'w1' });
  });

  it('removes a filter when set back to "all"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithClient(<TransactionFilters value={{ type: 'income', wallet_id: 'w1' }} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Tipe'), '');

    expect(onChange).toHaveBeenLastCalledWith({ wallet_id: 'w1' });
  });

  it('debounces the search box', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithClient(<TransactionFilters value={{}} onChange={onChange} />);

    await user.type(screen.getByLabelText('Cari catatan'), 'kopi');
    expect(onChange).not.toHaveBeenCalled();

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ q: 'kopi' }), { timeout: 1500 });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('resets everything', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithClient(<TransactionFilters value={{ type: 'income' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Reset filter' }));

    expect(onChange).toHaveBeenCalledWith({});
  });
});
