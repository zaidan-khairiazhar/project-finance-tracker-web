import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MonthPicker } from './MonthPicker';

describe('MonthPicker', () => {
  it('shows the month name and steps back and forward', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MonthPicker value="2026-11" max="2027-01" onChange={onChange} />);

    expect(screen.getByText('November 2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bulan sebelumnya' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-10');
    await user.click(screen.getByRole('button', { name: 'Bulan berikutnya' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-12');
  });

  it('cannot go past the latest month', () => {
    render(<MonthPicker value="2026-11" max="2026-11" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Bulan berikutnya' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Bulan ini' })).not.toBeInTheDocument();
  });

  it('offers a way back to the current month', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MonthPicker value="2026-08" max="2026-11" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Bulan ini' }));

    expect(onChange).toHaveBeenCalledWith('2026-11');
  });
});
