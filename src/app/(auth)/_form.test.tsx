import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PasswordField } from './_form';

describe('PasswordField', () => {
  it('hides the password by default and toggles visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordField id="password" label="Kata sandi" defaultValue="rahasia123" />);

    const input = screen.getByLabelText('Kata sandi');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Tampilkan kata sandi' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('rahasia123');

    await user.click(screen.getByRole('button', { name: 'Sembunyikan kata sandi' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('does not submit the form when the toggle is clicked', async () => {
    const user = userEvent.setup();
    let submitted = false;
    render(
      <form onSubmit={(e) => { e.preventDefault(); submitted = true; }}>
        <PasswordField id="password" label="Kata sandi" />
      </form>,
    );

    await user.click(screen.getByRole('button', { name: 'Tampilkan kata sandi' }));
    expect(submitted).toBe(false);
  });

  it('shows the error message', () => {
    render(<PasswordField id="password" label="Kata sandi" error={{ type: 'required', message: 'Wajib diisi.' }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Wajib diisi.');
  });
});
