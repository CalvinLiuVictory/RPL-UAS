# CampusCare Frontend (React + Vite)

Aplikasi web frontend sistem pelaporan dan pemeliharaan fasilitas kampus **CampusCare**.

## Konfigurasi Lingkungan (Environment Variables)

Aplikasi menggunakan variabel `VITE_API_URL` yang dikelola secara terpusat melalui `src/services/api.js`.

### 1. Pengembangan Lokal (Development)
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi dari `.env` lokal:
```env
VITE_API_URL=http://localhost:8000/api
```

Jalankan server pengembangan:
```bash
npm run dev
```

### 2. Lingkungan Produksi (Deployment Vercel)
Untuk deployment produksi di Vercel:
1. Buka dashboard Vercel pada proyek frontend Anda.
2. Masuk ke **Settings** > **Environment Variables**.
3. Tambahkan variabel baru:
   * **Key**: `VITE_API_URL`
   * **Value**: URL backend HTTPS publik Anda (contoh: `https://api-campuscare.up.railway.app/api`).
4. Lakukan **Redeploy** agar konfigurasi baru terkompilasi ke dalam bundle produksi.
