import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, stubFetch } from '@/test/utils';
import { CategoryList } from './CategoryList';

const cat = (over = {}) => ({ id: 'c1', parent_id: null, name: 'Makanan', type: 'expense', icon: null, color: null, ...over });

afterEach(() => vi.unstubAllGlobals());

describe('CategoryList', () => {
  it('shows a skeleton while loading', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    renderWithClient(<CategoryList onEdit={vi.fn()} />);

    expect(screen.getByRole('status', { name: 'Memuat kategori' })).toBeInTheDocument();
  });

  it('groups by type and indents subcategories under their parent', async () => {
    stubFetch(
      jsonResponse(200, {
        data: [
          cat({ id: 'c2', parent_id: 'c1', name: 'Kopi' }),
          cat({ id: 'c3', name: 'Gaji', type: 'income' }),
          cat(),
        ],
      }),
    );
    renderWithClient(<CategoryList onEdit={vi.fn()} />);

    const expense = await screen.findByRole('region', { name: 'Pengeluaran' });
    const income = screen.getByRole('region', { name: 'Pemasukan' });
    expect(within(income).getByText('Gaji')).toBeInTheDocument();

    const rows = within(expense).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('Makanan'), expect.stringContaining('Kopi')]);
    expect(rows[0]).toHaveAttribute('data-depth', '0');
    expect(rows[1]).toHaveAttribute('data-depth', '1');
  });

  it('shows a friendly empty state', async () => {
    stubFetch(jsonResponse(200, { data: [] }));
    renderWithClient(<CategoryList onEdit={vi.fn()} />);

    expect(await screen.findByText('Belum ada kategori')).toBeInTheDocument();
  });

  it("shows the server's reason when a category cannot be deleted", async () => {
    const user = userEvent.setup();
    stubFetch(
      jsonResponse(200, { data: [cat()] }),
      jsonResponse(422, { message: 'x', errors: { category: ['Kategori yang masih dipakai tidak bisa dihapus.'] } }),
    );
    vi.stubGlobal('confirm', () => true);
    renderWithClient(<CategoryList onEdit={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Hapus Makanan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Kategori yang masih dipakai tidak bisa dihapus.');
  });
});
