# Finance Tracker Web

Antarmuka web untuk `finance-api` (Laravel). Next.js 16 (App Router), TypeScript, Tailwind CSS 4.

## Menjalankan

Prasyarat: Node 20.9+ (disarankan 22) dan `finance-api` yang berjalan di `http://localhost:8000`.

```powershell
npm install
Copy-Item .env.example .env.local   # ubah API_BASE_URL jika alamat API berbeda
npm run dev                         # http://localhost:3000
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm test` | Test unit dan route handler (Vitest) |
| `npm run build` | Build production + pengecekan tipe |
| `npm run lint` | ESLint |

## Cara kerja sesi

- Browser **tidak pernah** memegang token API. Login lewat `POST /api/session`; server Next.js meneruskannya ke API, lalu menyimpan token di cookie `token` (`httpOnly`, `SameSite=Lax`, `Secure` hanya di production).
- Semua panggilan data memakai `/api/proxy/*`, yang memasang `Authorization: Bearer` dari cookie lalu meneruskan ke `API_BASE_URL`. Karena lewat server Next.js, API tidak butuh CORS.
- `src/proxy.ts` (di Next 16 menggantikan `middleware.ts`) mengalihkan halaman privat ke `/login` tanpa cookie, dan halaman login/daftar ke `/dashboard` bila sudah masuk.
- Tampilan uang dan tanggal: `src/lib/format.ts` (`Rp 1.500.000`, zona Asia/Jakarta).
