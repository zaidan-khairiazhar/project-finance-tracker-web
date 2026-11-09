import { expect, test } from "@playwright/test";

test("register → create wallet → add income and expense → dashboard shows them", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nama").fill("E2E User");
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
  await expect(page.getByText("Dompet Utama")).toBeVisible();

  await page.goto("/transactions");
  for (const [type, amount] of [["Pemasukan", "100.000"], ["Pengeluaran", "25.000"]]) {
    await page.getByRole("button", { name: "Tambah transaksi" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText(type, { exact: true }).click();
    await dialog.getByLabel("Jumlah (Rp)").fill(amount);
    await dialog.getByLabel("Dompet").selectOption({ label: "Dompet Utama" });
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(dialog).toBeHidden();
  }

  await page.goto("/dashboard");
  await expect(page.getByText("Rp 100.000").first()).toBeVisible();
  await expect(page.getByText("Rp 25.000").first()).toBeVisible();
  await expect(page.getByText("Rp 75.000").first()).toBeVisible();
});
