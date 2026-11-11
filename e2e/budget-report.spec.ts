import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

// Prasyarat sama dengan happy-path: finance-api berjalan di http://localhost:8000.
// Pengguna baru otomatis mendapat kategori bawaan, termasuk "Transportasi" (pengeluaran).
test("anggaran → transaksi → laporan (tren, kategori, dompet) → ekspor CSV", async ({ page }) => {
  const email = `e2e-budget-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nama").fill("E2E Budget");
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

  // Anggaran Transportasi Rp 100.000
  await page.goto("/budgets");
  await page.getByRole("button", { name: "Atur anggaran" }).click();
  const budgetDialog = page.getByRole("dialog");
  await budgetDialog.getByLabel("Kategori").selectOption({ label: "Transportasi" });
  await budgetDialog.getByLabel("Batas per bulan (Rp)").fill("100.000");
  await budgetDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(budgetDialog).toBeHidden();
  await expect(page.getByRole("meter", { name: "Transportasi" })).toBeVisible();

  // Pengeluaran Transportasi Rp 25.000
  await page.goto("/transactions");
  await page.getByRole("button", { name: "Tambah transaksi" }).click();
  const txDialog = page.getByRole("dialog");
  await txDialog.getByText("Pengeluaran", { exact: true }).click();
  await txDialog.getByLabel("Jumlah (Rp)").fill("25.000");
  await txDialog.getByLabel("Dompet").selectOption({ label: "Dompet Utama" });
  await txDialog.getByLabel("Kategori").selectOption({ label: "Transportasi" });
  await txDialog.getByLabel("Catatan").fill("Ojek");
  await txDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(txDialog).toBeHidden();

  // Progres anggaran ikut berubah: 25% terpakai
  await page.goto("/budgets");
  const progress = page.getByRole("listitem").filter({ hasText: "Transportasi" });
  await expect(progress).toContainText(/Rp\s25\.000\sdari\sRp\s100\.000/);
  await expect(page.getByRole("meter", { name: "Transportasi" })).toHaveAttribute("aria-valuenow", "25");

  // Laporan: tab Tren
  await page.goto("/reports");
  await expect(page.getByRole("tab", { name: "Tren" })).toHaveAttribute("aria-selected", "true");
  const trend = page.getByRole("table", { name: /tren bulanan/i });
  await expect(trend).toContainText(/Rp\s25\.000/);
  await page.getByRole("radio", { name: "12 bulan" }).click();
  await expect(trend.getByRole("row")).toHaveCount(13); // header + 12 bulan

  // Laporan: tab Kategori
  await page.getByRole("tab", { name: "Kategori" }).click();
  await expect(page).toHaveURL(/tab=category/);
  const categories = page.getByRole("table", { name: /kategori per bulan/i });
  await expect(categories).toContainText("Transportasi");
  await expect(categories).toContainText(/Rp\s25\.000/);

  // Laporan: tab Dompet
  await page.getByRole("tab", { name: "Dompet" }).click();
  await expect(page).toHaveURL(/tab=wallets/);
  const wallets = page.getByRole("table", { name: /ringkasan per dompet/i });
  await expect(wallets.getByRole("row").filter({ hasText: "Dompet Utama" })).toContainText(/Rp\s25\.000/);

  // Ekspor CSV
  await page.goto("/transactions");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Ekspor CSV" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^transaksi-\d{8}\.csv$/);
  const csv = await readFile((await download.path())!);
  expect([...csv.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8 utuh sampai browser
  expect(csv.toString("utf8")).toContain("Ojek");
});
