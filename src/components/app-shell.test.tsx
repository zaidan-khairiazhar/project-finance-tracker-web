import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithClient } from '@/test/utils';
import { AppShell } from './app-shell';

let pathname = '/budgets';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace: vi.fn() }),
}));

afterEach(() => {
  pathname = '/budgets';
  // @ts-expect-error jsdom tidak punya scrollIntoView; hapus stub
  delete Element.prototype.scrollIntoView;
});

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

  it('links to recurring transactions and has 8 links in each navigation', () => {
    renderWithClient(<AppShell>isi</AppShell>);

    for (const nav of screen.getAllByRole('navigation', { name: 'Navigasi utama' })) {
      expect(within(nav).getByRole('link', { name: 'Berulang' })).toHaveAttribute('href', '/recurring');
      expect(within(nav).getAllByRole('link')).toHaveLength(8);
    }
  });

  it('marks the current page', () => {
    renderWithClient(<AppShell>isi</AppShell>);

    for (const link of screen.getAllByRole('link', { name: 'Anggaran' })) {
      expect(link).toHaveAttribute('aria-current', 'page');
    }
    expect(screen.getAllByRole('link', { name: 'Laporan' })[0]).not.toHaveAttribute('aria-current');
  });

  it('links to goals in both navigations', () => {
    renderWithClient(<AppShell>isi</AppShell>);

    for (const nav of screen.getAllByRole('navigation', { name: 'Navigasi utama' })) {
      expect(within(nav).getByRole('link', { name: 'Target' })).toHaveAttribute('href', '/goals');
    }
  });

  it('scrolls the active item of the mobile navigation into view', () => {
    pathname = '/goals';
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderWithClient(<AppShell>isi</AppShell>);

    expect(scroll).toHaveBeenCalledTimes(1);
    expect(scroll).toHaveBeenCalledWith({ inline: 'center', block: 'nearest' });
    const mobile = screen.getAllByRole('navigation', { name: 'Navigasi utama' })[1];
    expect(scroll.mock.contexts[0]).toBe(within(mobile).getByRole('link', { name: 'Target' }));
  });
});
