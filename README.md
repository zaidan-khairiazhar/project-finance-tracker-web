# Finance Tracker Web

Antarmuka web untuk `finance-api` (Laravel). Next.js 16 (App Router), TypeScript, Tailwind CSS 4.

## Menjalankan

Prasyarat: Node 20.9+ (disarankan 22) dan `finance-api` yang berjalan di `http://localhost:8000`.

```powershell
npm install
Copy-Item .env.example .env.local   # ubah API_BASE_URL jika alamat API berbeda
npm run dev                         # http://localhost:3000
```

## Fitur

- Auth, dompet, kategori, transaksi (filter + paginasi), transfer antar dompet, dashboard bulanan.
- **Anggaran** (`/budgets`): batas pengeluaran bulanan per kategori dengan status ok / hampir habis / melebihi.
- **Laporan** (`/reports`, tab lewat `?tab=`): **Tren** (pemasukan vs pengeluaran 6/12 bulan), **Kategori** (perbandingan antar bulan, 3-12 bulan), **Dompet** (arus dan saldo akhir pada rentang tanggal).
- **Ekspor CSV** dari halaman Transaksi, mengikuti filter yang aktif (UTF-8 dengan BOM, terbaca di Excel).

Grafik mengikuti aturan dataviz: ada legenda, tabel pendamping, dan status dinyatakan dengan teks (bukan warna saja). Palet grafik tren (biru + oranye) divalidasi dengan `validate_palette.js` untuk mode terang dan gelap.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm test` | Test unit dan route handler (Vitest) |
| `npm run build` | Build production + pengecekan tipe |
| `npm run lint` | ESLint |
| `npm run e2e` | Tes end-to-end (Playwright): `happy-path` dan `budget-report` |

Tes E2E butuh `finance-api` berjalan di `http://localhost:8000` dengan database `finance` ter-migrasi; `finance-web` dinyalakan otomatis. Pertama kali: `npx playwright install chromium`.

## Cara kerja sesi

- Browser **tidak pernah** memegang token API. Login lewat `POST /api/session`; server Next.js meneruskannya ke API, lalu menyimpan token di cookie `token` (`httpOnly`, `SameSite=Lax`, `Secure` hanya di production).
- Semua panggilan data memakai `/api/proxy/*`, yang memasang `Authorization: Bearer` dari cookie lalu meneruskan ke `API_BASE_URL`. Karena lewat server Next.js, API tidak butuh CORS.
- `src/proxy.ts` (di Next 16 menggantikan `middleware.ts`) mengalihkan halaman privat ke `/login` tanpa cookie, dan halaman login/daftar ke `/dashboard` bila sudah masuk.
- Tampilan uang dan tanggal: `src/lib/format.ts` (`Rp 1.500.000`, zona Asia/Jakarta).
- Unduhan CSV juga lewat proxy. Proxy meneruskan `Content-Type` dan `Content-Disposition`, dan membaca respons sebagai byte mentah supaya BOM UTF-8 tidak hilang.
- Bulan pada laporan dan anggaran dikelompokkan menurut Asia/Jakarta, sama seperti backend.
