import { defineConfig, devices } from "@playwright/test";

// Prasyarat: finance-api berjalan di http://localhost:8000 dengan database `finance` ter-migrasi.
// finance-web dinyalakan otomatis lewat webServer.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
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
