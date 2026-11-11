import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadFile, filenameFromDisposition } from './download';

afterEach(() => vi.restoreAllMocks());

describe('filenameFromDisposition', () => {
  it('reads a quoted filename', () => {
    expect(filenameFromDisposition('attachment; filename="transaksi-20261111.csv"')).toBe('transaksi-20261111.csv');
  });

  it('reads an unquoted filename', () => {
    expect(filenameFromDisposition('attachment; filename=data.csv')).toBe('data.csv');
  });

  it('returns null when absent', () => {
    expect(filenameFromDisposition(null)).toBeNull();
    expect(filenameFromDisposition('attachment')).toBeNull();
  });

  it('refuses path separators in the name', () => {
    expect(filenameFromDisposition('attachment; filename="../../etc/passwd"')).toBeNull();
  });
});

describe('downloadFile', () => {
  it('clicks a temporary link with the filename, then cleans up', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:abc');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toBe('blob:abc');
      expect(this.download).toBe('laporan.csv');
    });

    downloadFile(new Blob(['a,b']), 'laporan.csv');

    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:abc');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
