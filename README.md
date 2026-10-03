# CampusCare Monorepo

Sistem Manajemen Pengaduan & Pemeliharaan Fasilitas Kampus terintegrasi (Operations & Facilities Hub).

## 1. Arsitektur Sistem

- **Frontend:** React 19 + Vite SPA (dideploy di Vercel: `https://rpl-uts.vercel.app`)
- **Backend:** Node.js Express (ES Modules) Serverless (dideploy di Vercel: `https://backend-node-weld.vercel.app/api`)
- **Database:** Supabase PostgreSQL (menjaga integritas skema dan relasi tanpa migrasi destruktif)
- **Deployment Monorepo:** Vercel Multi-Project (`frontend` dan `backend-node`)

---

## 2. Struktur Repositori

```text
├── backend-node/               # Backend Express API (Pengganti final Laravel)
│   ├── api/index.js            # Vercel serverless entry point
│   ├── src/                    # Controllers, middleware, database pool
│   ├── db/schema.sql           # Skema lengkap Supabase PostgreSQL
│   ├── test/                   # Test suite (contract test, security, UI verification)
│   └── vercel.json             # Konfigurasi rewrite serverless
├── frontend/                   # React Vite SPA Frontend
│   ├── src/                    # Components, pages, services API
│   └── vercel.json             # Header CSP ketat & routing SPA
├── .gitignore                  # Gitignore monorepo
└── vercel.json                 # Monorepo build configuration
```

---

## 3. Konfigurasi Database & Mode Supabase Pooler

Backend Node.js terhubung ke Supabase PostgreSQL melalui Supabase Connection Pooler (AWS Region `ap-northeast-2`).

### Perbandingan Mode Pooler

| Aspek | Session Mode (`port 5432`) | Transaction Mode (`port 6543`) |
| :--- | :--- | :--- |
| **Karakteristik** | Menahan koneksi database selama client session aktif. | Melepaskan koneksi database segera setelah tiap kueri/transaksi selesai. |
| **Dukungan Fitur** | Mendukung 100% fitur Postgres (prepared statements, session variables, advisory locks). | Mendukung kueri standar Express/pg. Tidak mendukung prepared statement di level server tanpa konfigurasi khusus. |
| **Risiko Serverless** | **Risiko Max Clients:** Di serverless (Vercel) dengan banyak instance paralel bersamaan, slot koneksi pooler dapat cepat penuh jika terjadi traffic spike. | Sangat optimal dan tahan lonjakan traffic serverless karena pooling dilakukan per transaksi. |
| **Rekomendasi** | Aman untuk beban normal / saat ini di produksi. | Disarankan beralih ke port 6543 jika traffic konkurensi meningkat tajam. |

Untuk beralih mode, cukup ubah nilai port pada environment variable `DATABASE_URL` di dashboard Vercel / `.env`.

---

## 4. Panduan Menjalankan Lokal

### Backend Node.js
```bash
cd backend-node
npm install
cp .env.example .env
npm run dev
```

### Frontend React
```bash
cd frontend
npm install
npm run dev
```

---

## 5. Pengujian & Verifikasi

- **Contract Test (19 pengujian paritas API):**
  ```bash
  cd backend-node
  node test/contract-test.js
  ```
- **Security & Robustness Suite (tanpa data residu):**
  ```bash
  cd backend-node
  API_URL=https://backend-node-weld.vercel.app/api node test/run_security_suite.js
  ```
- **Browser Headless & Production UI Verification:**
  ```bash
  cd backend-node
  node test/fase5_suite.js
  ```
