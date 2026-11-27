import { expect, test } from "@playwright/test";

// Prasyarat sama dengan spec lain: finance-api berjalan di http://localhost:8000, di sini dengan
// RECEIPT_SCANNER_DRIVER=null (scan dimatikan, jadi POST /receipts/scan menjawab 503 dan form diisi manual).
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("struk: scan gagal → isi manual → lihat foto → hapus foto", async ({ page }) => {
  const email = `e2e-receipts-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nama").fill("E2E Struk");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByLabel("Ulangi kata sandi").fill("password123");
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Pengguna baru belum punya dompet; transaksi butuh dompet.
  await page.goto("/wallets");
  await page.getByRole("button", { name: "Tambah dompet" }).click();
  const walletDialog = page.getByRole("dialog");
  await walletDialog.getByLabel("Nama dompet").fill("Dompet Utama");
  await walletDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(walletDialog).toBeHidden();

  // Scan: pilih foto lewat input file tersembunyi. Scanner mati, jadi muncul pesan isi manual.
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Scan struk" }).click();
  await page.locator("input[type=file][capture]").setInputFiles({ name: "struk.png", mimeType: "image/png", buffer: PNG_1X1 });

  const scanDialog = page.getByRole("dialog", { name: "Tambah transaksi dari struk" });
  await expect(scanDialog.getByText("Tidak bisa membaca struk otomatis, isi manual.")).toBeVisible();

  // Form baru tampil setelah kategori termuat, jadi tunggu kolomnya.
  const amount = scanDialog.getByLabel("Jumlah (Rp)");
  await expect(amount).toBeVisible();
  await amount.fill("25.000");
  await scanDialog.getByLabel("Dompet").selectOption({ label: "Dompet Utama" });
  await scanDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(scanDialog).toBeHidden();

  // Baris baru punya tombol "Lihat struk"; gambarnya benar-benar termuat.
  const viewButton = page.getByRole("button", { name: /Lihat struk/ });
  await expect(viewButton).toBeVisible();
  await viewButton.click();
  const viewer = page.getByRole("dialog", { name: "Foto struk" });
  const image = viewer.getByRole("img", { name: /^Struk/ });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await viewer.getByRole("button", { name: "Tutup" }).click();
  await expect(viewer).toBeHidden();

  // Ubah transaksi → Hapus foto (menerima confirm bawaan browser).
  await page.getByRole("button", { name: /Ubah transaksi/ }).click();
  const editDialog = page.getByRole("dialog");
  page.once("dialog", (d) => d.accept());
  await editDialog.getByRole("button", { name: "Hapus foto" }).click();
  await expect(editDialog.getByRole("button", { name: "Tambah foto struk" })).toBeVisible();
  await editDialog.getByRole("button", { name: "Batal" }).click();
  await expect(editDialog).toBeHidden();

  await expect(page.getByRole("button", { name: /Lihat struk/ })).toHaveCount(0);
});
