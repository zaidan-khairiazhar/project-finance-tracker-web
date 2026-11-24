import { defineConfig, devices } from "@playwright/test";

// Prasyarat: finance-api berjalan di http://localhost:8000 dengan database `finance` ter-migrasi.
// finance-web dinyalakan otomatis lewat webServer.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // Dev server mengompilasi halaman saat pertama dibuka dan API meng-hash kata sandi; 5 detik bawaan terlalu
  // ketat bila beberapa spec mendaftar bersamaan.
  expect: { timeout: 15_000 },
  workers: 2,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
