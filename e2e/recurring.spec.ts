import { expect, test } from "@playwright/test";

// Prasyarat sama dengan happy-path: finance-api berjalan di http://localhost:8000.
// Aturan harian yang mulai kemarin langsung membuat dua transaksi (kemarin dan hari ini) saat disimpan.
const jakartaDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

test("aturan berulang → transaksi otomatis → hapus tidak dibuat ulang", async ({ page }) => {
  const email = `e2e-recurring-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nama").fill("E2E Recurring");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByLabel("Ulangi kata sandi").fill("password123");
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Dompet
  await page.goto("/wallets");
  await page.getByRole("button", { name: "Tambah dompet" }).click();
  const walletDialog = page.getByRole("dialog");
  await walletDialog.getByLabel("Nama dompet").fill("Dompet Utama");
  await walletDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(walletDialog).toBeHidden();

  // Aturan harian pengeluaran, mulai kemarin
  await page.goto("/recurring");
  await page.getByRole("button", { name: "Tambah aturan" }).click();
  const ruleDialog = page.getByRole("dialog");
  await ruleDialog.getByLabel("Dompet").selectOption({ label: "Dompet Utama" });
  await ruleDialog.getByLabel("Kategori").selectOption({ label: "Transportasi" });
  await ruleDialog.getByLabel("Nominal (Rp)").fill("15.000");
  await ruleDialog.getByLabel("Catatan (opsional)").fill("Langganan harian");
  await ruleDialog.getByLabel("Frekuensi").selectOption("daily");
  await ruleDialog.getByLabel("Tanggal mulai").fill(jakartaDate(-1));
  await ruleDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(ruleDialog).toBeHidden();
  await expect(page.locator('[data-status="active"]')).toBeVisible();

  // Sudah dibuat saat simpan, jadi menjalankan lagi tidak menambah apa pun
  await page.getByRole("button", { name: "Jalankan sekarang" }).click();
  await expect(page.getByText("0 transaksi dibuat")).toBeVisible();

  // Dua transaksi bertanda Otomatis (kemarin dan hari ini)
  await page.goto("/transactions");
  const rows = page.getByRole("row").filter({ hasText: "Otomatis" });
  await expect(rows).toHaveCount(2);

  // Hapus satu, jalankan lagi: tidak muncul kembali
  page.once("dialog", (dialog) => dialog.accept());
  await rows.first().getByRole("button", { name: /^Hapus transaksi/ }).click();
  await expect(rows).toHaveCount(1);

  await page.goto("/recurring");
  await page.getByRole("button", { name: "Jalankan sekarang" }).click();
  await expect(page.getByText("0 transaksi dibuat")).toBeVisible();

  await page.goto("/transactions");
  await expect(page.getByRole("row").filter({ hasText: "Otomatis" })).toHaveCount(1);
});
