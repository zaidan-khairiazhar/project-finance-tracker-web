import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, renderWithClient, stubFetch } from '@/test/utils';
import { CategoryForm } from './CategoryForm';

const cat = (over = {}) => ({ id: 'c1', parent_id: null, name: 'Makanan', type: 'expense', icon: null, color: null, ...over });

afterEach(() => vi.unstubAllGlobals());

describe('CategoryForm', () => {
  it('creates a category and sends null for empty optional fields', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    const fetchMock = stubFetch(jsonResponse(200, { data: [] }), jsonResponse(201, { data: cat() }), jsonResponse(200, { data: [] }));
    renderWithClient(<CategoryForm onDone={onDone} />);

    await user.type(screen.getByLabelText('Nama kategori'), 'Kopi');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST') as [string, RequestInit];
    expect(post[0]).toBe('/api/proxy/categories');
    expect(JSON.parse(post[1].body as string)).toEqual({ name: 'Kopi', type: 'expense', icon: null, color: null, parent_id: null });
  });

  it('offers only root categories of the same type as parent', async () => {
    const user = userEvent.setup();
    stubFetch(
      jsonResponse(200, {
        data: [
          cat({ id: 'a', name: 'Makanan' }),
          cat({ id: 'b', name: 'Kopi', parent_id: 'a' }),
          cat({ id: 'c', name: 'Gaji', type: 'income' }),
        ],
      }),
    );
    renderWithClient(<CategoryForm onDone={vi.fn()} />);

    const select = await screen.findByLabelText('Induk (opsional)');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Makanan' })).toBeInTheDocument());
    expect(screen.queryByRole('option', { name: 'Kopi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Gaji' })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Tipe'), 'income');
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Gaji' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Makanan' })).not.toBeInTheDocument();
  });

  it('locks the type and omits it when editing', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(
      jsonResponse(200, { data: [cat()] }),
      jsonResponse(200, { data: cat({ name: 'Baru' }) }),
      jsonResponse(200, { data: [] }),
    );
    renderWithClient(<CategoryForm category={cat() as never} onDone={vi.fn()} />);

    expect(screen.getByLabelText('Tipe')).toBeDisabled();
    await user.clear(screen.getByLabelText('Nama kategori'));
    await user.type(screen.getByLabelText('Nama kategori'), 'Baru');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, i]) => (i as RequestInit)?.method === 'PATCH')).toBe(true));
    const patch = fetchMock.mock.calls.find(([, i]) => (i as RequestInit)?.method === 'PATCH') as [string, RequestInit];
    expect(patch[0]).toBe('/api/proxy/categories/c1');
    expect(JSON.parse(patch[1].body as string)).not.toHaveProperty('type');
  });

  it('shows server validation errors on the field', async () => {
    const user = userEvent.setup();
    stubFetch(
      jsonResponse(200, { data: [] }),
      jsonResponse(422, { message: 'x', errors: { parent_id: ['Induk tidak valid.'] } }),
    );
    renderWithClient(<CategoryForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Nama kategori'), 'Kopi');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText('Induk tidak valid.')).toBeInTheDocument();
  });

  it('validates the color before calling the API', async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch(jsonResponse(200, { data: [] }));
    renderWithClient(<CategoryForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Nama kategori'), 'Kopi');
    await user.type(screen.getByLabelText('Warna (opsional)'), 'merah');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));

    expect(await screen.findByText(/#RRGGBB, mis\./)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // hanya memuat daftar kategori
  });
});
