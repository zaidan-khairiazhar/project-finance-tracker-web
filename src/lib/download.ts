/** Nama berkas dari header Content-Disposition; null jika tidak ada atau mengandung pemisah path. */
export function filenameFromDisposition(header: string | null): string | null {
  const match = header?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const name = match?.[1]?.trim();
  if (!name || /[\\/]/.test(name)) return null;

  return name;
}

/** Simpan `blob` sebagai berkas unduhan lewat tautan sementara. */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
