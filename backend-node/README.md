# CampusCare Node.js Express Backend

Backend pengganti untuk CampusCare yang ditulis ulang dari Laravel (PHP, Sanctum) ke Node.js (Express) dengan kontrak API 100% identik. Dirancang untuk dijalankan di lingkungan Serverless Vercel dan terhubung ke Supabase PostgreSQL melalui Supabase Transaction Pooler.

---

## 🛠️ Stack Teknologi
- **Runtime:** Node.js 20+ (ES Modules)
- **Framework:** Express.js 4
- **Database Driver:** `pg` (node-postgres) dengan query berparameter (tanpa ORM)
- **Validasi:** Zod (dengan format error Laravel 422)
- **Keamanan & Autentikasi:** Bcryptjs ($2y$ hash compatible), Helmet, CORS, Token Opaque Sanctum-compatible (SHA-256)
- **Database:** Supabase PostgreSQL (port 6543 pooler mode)

---

## 🚀 Menjalankan Secara Lokal

1. Salin berkas lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Sesuaikan nilai `DATABASE_URL` (menggunakan transaction pooler Supabase port 6543) dan `FRONTEND_URL`.
3. Pasang dependensi:
   ```bash
   npm install
   ```
4. Jalankan server pembangunan lokal:
   ```bash
   npm run dev
   ```
   Server akan berjalan di `http://localhost:8000`.

---

## ☁️ Panduan Deploy ke Vercel (Serverless)

### 1. Buat Proyek Baru di Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New Project**.
2. Pilih repositori `RPL - UTS` (atau nama repo Anda).
3. **Penting:** Pada bagian **Root Directory**, klik **Edit** dan pilih:
   ```text
   backend-node
   ```
4. Framework Preset biarkan **Other**.

### 2. Atur Environment Variables di Vercel
Tambahkan variabel lingkungan berikut di dashboard Vercel (**Settings** -> **Environment Variables**):

| Nama Variabel | Contoh Nilai | Deskripsi |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres` | URL koneksi **Transaction Pooler** resmi Supabase (Mode Transaction, Port 6543) dari **Supabase Dashboard > Connect**. Gunakan username \`postgres.[REF]\` dan host \`*.pooler.supabase.com:6543\`. URL-encode karakter khusus di password (misal \`#\` menjadi \`%23\`). |
| `FRONTEND_URL` | `https://rpl-uts.vercel.app` | URL origin frontend yang diizinkan CORS (pisahkan dengan koma jika lebih dari satu). |
| `NODE_ENV` | `production` | Mode produksi |
| `TOKEN_TTL_MINUTES` | `1440` | Masa berlaku token (1440 menit = 24 jam) |
| `DB_SSL_CA` | *(Opsional)* `-----BEGIN CERTIFICATE-----...` | Isi sertifikat CA root Supabase jika ingin verifikasi TLS ketat (`rejectUnauthorized: true`). |

### 3. Deploy
Klik **Deploy**. Vercel akan membaca `api/index.js` dan `vercel.json` dan menyajikan seluruh endpoint di bawah prefix `/api`.

### 4. Perbarui Frontend
Setelah backend live (misalnya di `https://campuscare-api.vercel.app`):
1. Buka project frontend di Vercel.
2. Ubah `VITE_API_URL` menjadi `https://campuscare-api.vercel.app/api`.
3. **Penting:** Lakukan **Redeploy** frontend, karena variabel `VITE_` dibundel saat waktu build (`npm run build`).

### 5. Health Check
Periksa apakah backend berfungsi normal dengan membuka:
```text
GET https://<backend-url>.vercel.app/api/health
```
Respons yang diharapkan:
```json
{"status":"ok","timestamp":"2026-10-03T..."}
```

---

## 🔒 Catatan Keamanan & Desain Arsitektur

### 1. Autentikasi Kompatibel Laravel Sanctum
- Token autentikasi disimpan dalam format hash SHA-256 pada tabel `personal_access_tokens` yang kompatibel dengan format Sanctum (`id|plaintext`).
- Password diverifikasi dengan format Bcrypt `$2y$` sehingga seluruh pengguna lama dapat langsung login tanpa reset password.

### 2. Dual Rate Limiting Atomik
- Rate limiting 5 kali percobaan gagal per menit per IP + email DAN 20 kali per menit per IP.
- Menggunakan query atomik PostgreSQL `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` pada tabel `login_attempts` untuk mencegah race condition pada serverless multi-instance.
- Mengembalikan header `Retry-After`.

### 3. Konfigurasi SSL Database & Catatan Risiko
- Secara default, koneksi ke Supabase Transaction Pooler (port 6543) menggunakan konfigurasi `{ rejectUnauthorized: false }`. Hal ini dikarenakan sertifikat perantara pooler Supabase tidak terdaftar pada CA bundle default Node.js.
- **Risiko Keamanan:** Jika `DB_SSL_CA` tidak diisi, koneksi tetap terenkripsi (TLS), namun rentan terhadap serangan *Man-In-The-Middle (MITM)* di tingkat jaringan jika penyerang dapat memalsukan DNS/sertifikat host.
- **Rekomendasi Produksi:** Unduh sertifikat root Supabase dari dashboard Supabase (**Project Settings** -> **Database** -> **SSL Certificate**), lalu tempelkan string sertifikat ke env `DB_SSL_CA`. Backend akan otomatis beralih ke mode `{ rejectUnauthorized: true, ca: DB_SSL_CA }`.

### 4. Pencegahan IDOR & Kontrol Akses
- Pengguna dengan role `user` hanya dapat melihat komplain miliknya (`WHERE p.user_id = $1`). Endpoint modifikasi/hapus komplain dibatasi pada level middleware dan controller.
- Teknisi hanya dapat melihat dan memperbarui status/catatan pada penugasan yang secara eksplisit didelegasikan kepadanya (`WHERE teknisi_id = $1`).
- Komplain berstatus `Selesai` dilindungi dari pembukaan kembali oleh teknisi (mengembalikan status 422). Hanya role `admin` yang berwenang membuka kembali komplain.
