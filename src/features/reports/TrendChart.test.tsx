import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrendChart } from './TrendChart';

const data = [
  { month: '2026-09', income: 5000000, expense: 3000000, net: 2000000 },
  { month: '2026-10', income: 4000000, expense: 4500000, net: -500000 },
  { month: '2026-11', income: 0, expense: 0, net: 0 },
];

describe('TrendChart', () => {
  it('has a legend naming both series', () => {
    render(<TrendChart data={data} />);

    const legend = screen.getByRole('list', { name: 'Legenda' });
    expect(within(legend).getByText('Pemasukan')).toBeInTheDocument();
    expect(within(legend).getByText('Pengeluaran')).toBeInTheDocument();
  });

  it('draws two bars per month, scaled to the largest value', () => {
    render(<TrendChart data={data} />);

    const bar = (label: string) => screen.getByTestId(label);
    expect(bar('bar-income-2026-09')).toHaveAttribute('data-value', '5000000');
    const tallest = Number(bar('bar-income-2026-09').getAttribute('height'));
    const expense = Number(bar('bar-expense-2026-10').getAttribute('height'));
    expect(expense / tallest).toBeCloseTo(4500000 / 5000000, 2);
  });

  it('describes the chart for assistive technology', () => {
    render(<TrendChart data={data} />);

    expect(screen.getByRole('img', { name: /pemasukan dan pengeluaran per bulan/i })).toBeInTheDocument();
  });

  it('has a companion table with every month, amounts and net', () => {
    render(<TrendChart data={data} />);

    const table = screen.getByRole('table', { name: /tren bulanan/i });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(within(rows[1]).getByText('September 2026')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 5.000.000')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Rp 3.000.000')).toBeInTheDocument();
  });

  it('states the net as text with a sign, not by color alone', () => {
    render(<TrendChart data={data} />);

    const rows = within(screen.getByRole('table')).getAllByRole('row');
    expect(within(rows[1]).getByText('Surplus +Rp 2.000.000')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Defisit -Rp 500.000')).toBeInTheDocument();
    expect(within(rows[3]).getAllByRole('cell').at(-1)).toHaveTextContent(/^Rp 0$/);
  });

  it('does not divide by zero when every month is empty', () => {
    render(<TrendChart data={[{ month: '2026-11', income: 0, expense: 0, net: 0 }]} />);

    expect(screen.getByTestId('bar-income-2026-11')).toHaveAttribute('height', '0');
  });
});
