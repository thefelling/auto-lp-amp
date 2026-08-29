# Auto LP & AMP Generator

Aplikasi ini terdiri dari frontend React/Vite dan backend Express. Frontend dapat dipublikasikan ke Cloudflare Pages, sedangkan backend berjalan di Railway atau server Node.js lain.

## Build frontend

Dari root project:

```bash
npm run build
```

Hasil build berada di `frontend/dist`.

## Pengaturan Cloudflare Pages

Gunakan pengaturan berikut pada project Pages `auto-lp-amp`:

| Pengaturan | Nilai |
|---|---|
| Root directory | `/` |
| Build command | `npm run build` |
| Build output directory | `frontend/dist` |
| Production branch | `main` |
| Environment variable | `VITE_API_URL=https://auto-lp-amp-production.up.railway.app` |

Setelah pengaturan disimpan, buat deployment baru dari branch production dan pastikan statusnya **Success**. URL production yang digunakan adalah:

```text
https://auto-lp-amp.pages.dev
```

URL dengan awalan hash, misalnya `8845651e.auto-lp-amp.pages.dev`, adalah **preview deployment**, bukan production. Preview dapat dilindungi Cloudflare Access dan dapat berisi commit berbeda.

## Backend

Pastikan environment backend tersedia di Railway:

```text
PORT=3000
DATABASE_URL=...
REDIS_URL=...
JWT_SECRET=...
MASTER_USERNAME=...
MASTER_PASSWORD=...
OPENAI_API_KEY=...       # opsional; generator memiliki fallback
FAL_API_KEY=...           # opsional; generator memiliki fallback
```

Tes backend:

```bash
curl https://auto-lp-amp-production.up.railway.app/health
```

Respons yang benar memiliki `status: healthy` dan `database: connected`.

## Format titles.txt

Satu title per baris. Nama situs cukup muncul di dalam baris dan tidak perlu menggunakan `#` atau format section:

```text
OMUTOGEL | selalu di hati
Mulantogel | website untuk semua kalangan
Keitogel - game online terkini
saldowd ✨ game untuk semua kalangan
```

Jika nama situs di form adalah `omutogel`, sistem hanya memilih baris yang mengandung `omutogel`, tanpa membedakan huruf besar dan kecil.
