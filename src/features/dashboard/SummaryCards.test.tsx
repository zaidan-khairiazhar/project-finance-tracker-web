import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SummaryCards } from './SummaryCards';

const data = { month: '2026-11', income: 5000000, expense: 1500000, net: 3500000, total_balance: 9000000 };

describe('SummaryCards', () => {
  it('renders summary values in rupiah', () => {
    render(<SummaryCards data={data} />);

    expect(screen.getByText('Rp 5.000.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 1.500.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 3.500.000')).toBeInTheDocument();
    expect(screen.getByText('Rp 9.000.000')).toBeInTheDocument();
  });

  it('labels each figure', () => {
    render(<SummaryCards data={data} />);

    for (const label of ['Total saldo', 'Pemasukan', 'Pengeluaran', 'Selisih']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows a negative net with a minus sign', () => {
    render(<SummaryCards data={{ ...data, income: 1000000, expense: 1500000, net: -500000 }} />);

    expect(screen.getByText('-Rp 500.000')).toBeInTheDocument();
  });
});
