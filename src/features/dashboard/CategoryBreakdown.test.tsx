import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryBreakdown } from './CategoryBreakdown';

const row = (name: string, total: number, category_id: string | null = name) => ({ category_id, name, color: null, total });

describe('CategoryBreakdown', () => {
  it('shows an empty state when there is no data', () => {
    render(<CategoryBreakdown data={[]} type="expense" />);

    expect(screen.getByText('Belum ada pengeluaran bulan ini')).toBeInTheDocument();
  });

  it('uses the income wording for income', () => {
    render(<CategoryBreakdown data={[]} type="income" />);

    expect(screen.getByText('Belum ada pemasukan bulan ini')).toBeInTheDocument();
  });

  it('lists categories largest first with amount and share', () => {
    render(<CategoryBreakdown data={[row('Transportasi', 250000), row('Makanan', 750000)]} type="expense" />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Makanan')).toBeInTheDocument();
    expect(within(items[0]).getByText('Rp 750.000')).toBeInTheDocument();
    expect(within(items[0]).getByText('75%')).toBeInTheDocument();
    expect(within(items[1]).getByText('25%')).toBeInTheDocument();
  });

  it('scales bar length to the largest category', () => {
    render(<CategoryBreakdown data={[row('Makanan', 800000), row('Transportasi', 200000)]} type="expense" />);

    const fill = (name: string) => screen.getByRole('meter', { name }).firstElementChild as HTMLElement;
    expect(fill('Makanan')).toHaveStyle({ width: '100%' });
    expect(fill('Transportasi')).toHaveStyle({ width: '25%' });
  });

  it('shows <1% instead of 0% for a tiny share', () => {
    render(<CategoryBreakdown data={[row('Besar', 1000000), row('Kecil', 1000)]} type="expense" />);

    expect(screen.getByText('<1%')).toBeInTheDocument();
  });

  it('folds the tail beyond eight categories into "Lainnya"', () => {
    const data = Array.from({ length: 11 }, (_, i) => row(`Kat ${i + 1}`, (11 - i) * 1000));
    render(<CategoryBreakdown data={data} type="expense" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(9);
    const other = screen.getByText('Lainnya (3 kategori)').closest('li') as HTMLElement;
    expect(within(other).getByText('Rp 6.000')).toBeInTheDocument(); // 3+2+1 ribu
  });

  it('names the uncategorised bucket', () => {
    render(<CategoryBreakdown data={[{ category_id: null, name: 'Tanpa kategori', color: null, total: 5000 }]} type="expense" />);

    expect(screen.getByText('Tanpa kategori')).toBeInTheDocument();
  });
});
