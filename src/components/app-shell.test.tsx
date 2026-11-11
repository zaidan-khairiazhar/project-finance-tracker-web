import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithClient } from '@/test/utils';
import { AppShell } from './app-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/budgets',
  useRouter: () => ({ replace: vi.fn() }),
}));

describe('AppShell', () => {
  it('links to budgets and reports in both navigations', () => {
    renderWithClient(<AppShell>isi</AppShell>);

    const navs = screen.getAllByRole('navigation', { name: 'Navigasi utama' });
    expect(navs).toHaveLength(2);
    for (const nav of navs) {
      expect(within(nav).getByRole('link', { name: 'Anggaran' })).toHaveAttribute('href', '/budgets');
      expect(within(nav).getByRole('link', { name: 'Laporan' })).toHaveAttribute('href', '/reports');
    }
  });

  it('marks the current page', () => {
    renderWithClient(<AppShell>isi</AppShell>);

    for (const link of screen.getAllByRole('link', { name: 'Anggaran' })) {
      expect(link).toHaveAttribute('aria-current', 'page');
    }
    expect(screen.getAllByRole('link', { name: 'Laporan' })[0]).not.toHaveAttribute('aria-current');
  });
});
