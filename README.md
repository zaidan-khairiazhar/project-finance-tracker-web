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
- **Target tabungan** (`/goals`): target dengan nominal dan tenggat opsional, terhubung ke satu dompet. Progres dihitung dari saldo dompet itu (bukan setoran terpisah), lengkap dengan status Berjalan / Tercapai / Lewat tenggat dan "perlu Rp X per bulan". Satu dompet hanya untuk satu target.
- **Transaksi berulang** (`/recurring`): aturan harian / mingguan / bulanan untuk pemasukan atau pengeluaran. Transaksi dibuat otomatis (termasuk yang terlewat, dengan tanggal yang benar) dan ditandai **Otomatis** di daftar transaksi. Aturan bisa dijeda, diaktifkan lagi, diubah, dihapus, atau dijalankan manual lewat **Jalankan sekarang**. Aturan yang dompet atau kategorinya tidak valid lagi dijeda otomatis beserta alasannya.
- **Scan struk** (`/transactions`): lihat bagian di bawah.
- **Ekspor CSV** dari halaman Transaksi, mengikuti filter yang aktif (UTF-8 dengan BOM, terbaca di Excel).

Grafik mengikuti aturan dataviz: ada legenda, tabel pendamping, dan status dinyatakan dengan teks (bukan warna saja). Palet grafik tren (biru + oranye) divalidasi dengan `validate_palette.js` untuk mode terang dan gelap.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm test` | Test unit dan route handler (Vitest) |
| `npm run build` | Build production + pengecekan tipe |
| `npm run lint` | ESLint |
| `npm run e2e` | Tes end-to-end (Playwright): `happy-path`, `budget-report`, `goals`, `recurring`, `receipts` |

Tes E2E butuh `finance-api` berjalan di `http://localhost:8000` dengan database `finance` ter-migrasi; `finance-web` dinyalakan otomatis. Pertama kali: `npx playwright install chromium`.

## Scan struk

Tombol **Scan struk** di `/transactions` membuka kamera (atau pilih foto), membaca struk, lalu mengisi form pengeluaran (nominal, tanggal, toko, kategori) untuk dicek dan disimpan. Foto ikut tersimpan pada transaksi dan bisa dilihat lewat ikon klip di daftar, serta diganti atau dihapus dari form ubah.

- Butuh `finance-api` dengan `RECEIPT_SCANNER_DRIVER=gemini` atau `claude` beserta kuncinya (lihat README `finance-api`). Bila mati atau gagal, pesan "isi manual" tampil dan form tetap bisa diisi sendiri.
- Alur: pilih foto, saran terisi, periksa form, Simpan (transaksi dibuat, lalu foto diunggah; bila unggah gagal bisa dicoba lagi).
- Foto diperkecil di browser sebelum diunggah.
- Privasi: hanya gambar dan daftar kategori pengeluaran pengguna yang dikirim ke penyedia AI.

## Cara kerja sesi

- Browser **tidak pernah** memegang token API. Login lewat `POST /api/session`; server Next.js meneruskannya ke API, lalu menyimpan token di cookie `token` (`httpOnly`, `SameSite=Lax`, `Secure` hanya di production).
- Semua panggilan data memakai `/api/proxy/*`, yang memasang `Authorization: Bearer` dari cookie lalu meneruskan ke `API_BASE_URL`. Karena lewat server Next.js, API tidak butuh CORS.
- `src/proxy.ts` (di Next 16 menggantikan `middleware.ts`) mengalihkan halaman privat ke `/login` tanpa cookie, dan halaman login/daftar ke `/dashboard` bila sudah masuk.
- Tampilan uang dan tanggal: `src/lib/format.ts` (`Rp 1.500.000`, zona Asia/Jakarta).
- Unduhan CSV juga lewat proxy. Proxy meneruskan `Content-Type` dan `Content-Disposition`, dan membaca respons sebagai byte mentah supaya BOM UTF-8 tidak hilang.
- Bulan pada laporan dan anggaran dikelompokkan menurut Asia/Jakarta, sama seperti backend.
