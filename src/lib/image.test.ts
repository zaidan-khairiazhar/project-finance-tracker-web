import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage, scaleToFit } from './image';

describe('scaleToFit', () => {
  it('mengecilkan lanskap ke sisi terpanjang maksimal', () => {
    expect(scaleToFit(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
  });
  it('mengecilkan potret', () => {
    expect(scaleToFit(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });
  it('tidak memperbesar gambar kecil', () => {
    expect(scaleToFit(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});

function mockCanvas(blob: Blob | null) {
  const drawImage = vi.fn();
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toBlob: (cb: (b: Blob | null) => void) => cb(blob) };
  const real = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'canvas' ? (canvas as unknown as HTMLCanvasElement) : real(tag),
  );
  return canvas;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('compressImage', () => {
  it('menghasilkan JPEG berekstensi .jpg dengan sisi terpanjang <= 1600', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close }));
    const canvas = mockCanvas(new Blob(['x'], { type: 'image/jpeg' }));
    const out = await compressImage(new File(['abc'], 'struk.png', { type: 'image/png' }));
    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('struk.jpg');
    expect(Math.max(canvas.width, canvas.height)).toBeLessThanOrEqual(1600);
    expect(canvas.width).toBe(1600);
    expect(close).toHaveBeenCalled();
  });

  it('mengembalikan file asli bila gambar tak bisa didekode', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad')));
    const file = new File(['abc'], 'struk.heic', { type: 'image/heic' });
    expect(await compressImage(file)).toBe(file);
  });

  it('mengembalikan file asli bila toBlob menghasilkan null', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10, close }));
    mockCanvas(null);
    const file = new File(['abc'], 'a.png', { type: 'image/png' });
    expect(await compressImage(file)).toBe(file);
    expect(close).toHaveBeenCalled();
  });
});
