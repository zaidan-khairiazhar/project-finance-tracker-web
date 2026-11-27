/** Skala dimensi agar sisi terpanjang ≤ maxSide; rasio dijaga, tidak pernah memperbesar. */
export function scaleToFit(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const ratio = maxSide / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

/**
 * Kecilkan dan kompres gambar menjadi JPEG sebelum diunggah. Bila gambar tak bisa didekode atau
 * kanvas tak tersedia, kembalikan file asli (tidak pernah melempar).
 */
export async function compressImage(file: File, opts: { maxSide?: number; quality?: number } = {}): Promise<File> {
  const { maxSide = 1600, quality = 0.8 } = opts;
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const { width, height } = scaleToFit(bitmap.width, bitmap.height, maxSide);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) return file;
    const name = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}
