import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RangePicker } from './RangePicker';

const value = { from: '2026-11-01', to: '2026-11-30' };

describe('RangePicker', () => {
  it('shows the current range in two date fields', () => {
    render(<RangePicker value={value} onChange={() => {}} />);

    expect(screen.getByLabelText('Dari')).toHaveValue('2026-11-01');
    expect(screen.getByLabelText('Sampai')).toHaveValue('2026-11-30');
  });

  it('reports a valid change', async () => {
    const onChange = vi.fn();
    render(<RangePicker value={value} onChange={onChange} />);

    const from = screen.getByLabelText('Dari');
    await userEvent.clear(from);
    await userEvent.type(from, '2026-10-15');

    expect(onChange).toHaveBeenLastCalledWith({ from: '2026-10-15', to: '2026-11-30' });
  });

  it('rejects an end date before the start date', async () => {
    const onChange = vi.fn();
    render(<RangePicker value={value} onChange={onChange} />);

    const to = screen.getByLabelText('Sampai');
    await userEvent.clear(to);
    await userEvent.type(to, '2026-10-01');

    expect(screen.getByRole('alert')).toHaveTextContent('Tanggal akhir tidak boleh sebelum tanggal awal');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('rejects a range longer than 366 days', async () => {
    const onChange = vi.fn();
    render(<RangePicker value={value} onChange={onChange} />);

    const from = screen.getByLabelText('Dari');
    await userEvent.clear(from);
    await userEvent.type(from, '2025-01-01');

    expect(screen.getByRole('alert')).toHaveTextContent('Rentang maksimum 366 hari');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts exactly 366 days', async () => {
    const onChange = vi.fn();
    render(<RangePicker value={{ from: '2026-01-01', to: '2026-01-31' }} onChange={onChange} />);

    const from = screen.getByLabelText('Dari');
    await userEvent.clear(from);
    await userEvent.type(from, '2025-01-31');

    expect(onChange).toHaveBeenLastCalledWith({ from: '2025-01-31', to: '2026-01-31' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
