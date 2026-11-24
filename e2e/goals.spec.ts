import { expect, test } from "@playwright/test";

// Prasyarat sama dengan spec lain: finance-api berjalan di http://localhost:8000.
const jakartaDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

test("target tabungan: progres mengikuti saldo dompet sampai tercapai", async ({ page }) => {
  const email = `e2e-goals-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nama").fill("E2E Goals");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata sandi", { exact: true }).fill("password123");
  await page.getByLabel("Ulangi kata sandi").fill("password123");
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Dompet tabungan
  await page.goto("/wallets");
  await page.getByRole("button", { name: "Tambah dompet" }).click();
  const walletDialog = page.getByRole("dialog");
  await walletDialog.getByLabel("Nama dompet").fill("Tabungan");
  await walletDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(walletDialog).toBeHidden();

  // Target Rp 1.000.000 dengan tenggat bulan depan
  await page.goto("/goals");
  await page.getByRole("button", { name: "Tambah target" }).click();
  const goalDialog = page.getByRole("dialog");
  await goalDialog.getByLabel("Nama target").fill("Dana darurat");
  await goalDialog.getByLabel("Dompet").selectOption({ label: "Tabungan" });
  await goalDialog.getByLabel("Nominal target (Rp)").fill("1.000.000");
  await goalDialog.getByLabel("Tenggat (opsional)").fill(jakartaDate(40));
  await goalDialog.getByRole("button", { name: "Simpan" }).click();
  await expect(goalDialog).toBeHidden();

  const meter = page.getByRole("meter", { name: "Dana darurat" });
  await expect(meter).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByText(/Perlu .* per bulan/)).toBeVisible();

  // Dompet itu sudah dipakai, jadi tidak lagi ditawarkan untuk target baru
  await page.getByRole("button", { name: "Tambah target" }).click();
  await expect(page.getByRole("dialog").getByLabel("Dompet").locator("option", { hasText: "Tabungan" })).toHaveCount(0);
  await page.getByRole("dialog").getByRole("button", { name: "Batal" }).click();

  // Pemasukan Rp 400.000 lalu Rp 600.000 ke dompet itu
  for (const amount of ["400.000", "600.000"]) {
    await page.goto("/transactions");
    await page.getByRole("button", { name: "Tambah transaksi" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText("Pemasukan", { exact: true }).click();
    await dialog.getByLabel("Jumlah (Rp)").fill(amount);
    await dialog.getByLabel("Dompet").selectOption({ label: "Tabungan" });
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/goals");
    if (amount === "400.000") {
      await expect(page.getByRole("meter", { name: "Dana darurat" })).toHaveAttribute("aria-valuenow", "40");
    }
  }

  await expect(page.getByRole("meter", { name: "Dana darurat" })).toHaveAttribute("aria-valuenow", "100");
  await expect(page.locator('[data-status="reached"]')).toBeVisible();
});
