import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { TransactionForm } from './TransactionForm';

vi.mock('@/features/wallets/api', () => ({
  useWallets: () => ({
    data: [
      { id: 'w1', name: 'BCA', is_archived: false },
      { id: 'w2', name: 'Lama', is_archived: true },
    ],
  }),
}));
vi.mock('@/features/categories/api', () => ({
  useCategories: () => ({
    data: [
      { id: 'c1', parent_id: null, name: 'Makanan', type: 'expense' },
      { id: 'c2', parent_id: 'c1', name: 'Kopi', type: 'expense' },
      { id: 'c3', parent_id: null, name: 'Gaji', type: 'income' },
    ],
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);
const click = (name: RegExp | string) => userEvent.click(screen.getByRole('button', { name }));

describe('TransactionForm', () => {
  it('shows a validation error when amount is empty', async () => {
    render(<TransactionForm onSubmit={vi.fn()} />, { wrapper });
    await click(/simpan/i);

    expect(await screen.findByText('Jumlah wajib diisi.')).toBeInTheDocument();
  });

  it('submits the amount as an integer in rupiah', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TransactionForm onSubmit={onSubmit} defaultValues={{ wallet_id: 'w1', type: 'expense' }} />, { wrapper });

    await userEvent.type(screen.getByLabelText(/jumlah/i), '1.500.000');
    await click(/simpan/i);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 1500000, wallet_id: 'w1', type: 'expense' })));
    expect(onSubmit.mock.calls[0][0].occurred_at).toMatch(/\+07:00$/);
  });

  it('maps a 422 from the API onto the amount field', async () => {
    const err = Object.assign(new ApiError('x'), { status: 422, errors: { amount: ['Jumlah tidak valid.'] } });
    render(<TransactionForm onSubmit={vi.fn().mockRejectedValue(err)} defaultValues={{ wallet_id: 'w1', type: 'expense', amount: 5 }} />, { wrapper });
    await click(/simpan/i);

    expect(await screen.findByText('Jumlah tidak valid.')).toBeInTheDocument();
  });

  it('only offers active wallets and picks the first by default', async () => {
    render(<TransactionForm onSubmit={vi.fn()} />, { wrapper });

    expect(screen.queryByRole('option', { name: 'Lama' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Dompet')).toHaveValue('w1'));
  });

  it('filters categories by type and clears a category that no longer fits', async () => {
    render(<TransactionForm onSubmit={vi.fn()} defaultValues={{ wallet_id: 'w1', type: 'expense', category_id: 'c1' }} />, { wrapper });

    expect(screen.getByRole('option', { name: 'Makanan' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Kopi/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Gaji' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Kategori')).toHaveValue('c1');

    await userEvent.click(screen.getByRole('radio', { name: 'Pemasukan' }));

    expect(screen.getByRole('option', { name: 'Gaji' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Makanan' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Kategori')).toHaveValue('');
  });

  it('prefills when editing and sends a null category/note when cleared', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <TransactionForm
        onSubmit={onSubmit}
        defaultValues={{ wallet_id: 'w1', type: 'expense', amount: 25000, category_id: '', occurred_at: '2026-11-07T23:30', note: '' }}
      />,
      { wrapper },
    );

    expect(screen.getByLabelText(/jumlah/i)).toHaveValue('25.000');
    await click(/simpan/i);

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ amount: 25000, category_id: null, note: null, occurred_at: '2026-11-07T23:30:00+07:00' });
  });
});
