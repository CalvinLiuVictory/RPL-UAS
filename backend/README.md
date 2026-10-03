# 🛠️ Service & Maintenance Management System API

API Backend berbasis RESTful untuk sistem manajemen pelaporan kerusakan dan perawatan fasilitas (Helpdesk & Maintenance) menggunakan **Laravel 11**, **PostgreSQL**, dan **Laravel Sanctum**.

---

## 🚀 Fitur & Pencapaian yang Sudah Selesai

Sistem ini telah selesai dibangun dan diverifikasi secara *End-to-End* (E2E) dengan cakupan logika bisnis sebagai berikut:

### 1. Otentikasi & Hak Akses (RBAC)
* ✅ **Laravel Sanctum Authentication**: Fitur Login dan Logout berbasis Token.
* ✅ **Role-Based Access Control Middleware**: Proteksi *endpoint* terpisah berdasarkan 3 peran pengguna (*Admin*, *User/Pelapor*, dan *Teknisi*).

### 2. Manajemen Entitas & Relasi
* ✅ **Gedung & Ruangan**: Relasi *One-to-Many* dengan Eager Loading data ruangan.
* ✅ **Perangkat**: Manajemen status perangkat (`Bagus` / `Rusak`).
* ✅ **Pengaduan & Maintenance**: Pengelolaan tiket laporan dari pengajuan hingga penyelesaian.

### 3. Otomatisasi Logika Bisnis (State Management)
* ✅ **User Melaporkan Kerusakan**: Saat *User* membuat pengaduan, status tiket menjadi `Menunggu` dan status perangkat otomatis berubah menjadi **`Rusak`**.
* ✅ **Admin Menugaskan Teknisi**: *Admin* menugaskan *Teknisi* tertentu, status tiket berubah menjadi `Diproses`.
* ✅ **Teknisi Memperbaiki**: *Teknisi* mencatat deskripsi perbaikan dan menyelesaikan tiket (status `Selesai`), yang secara otomatis mengembalikan status perangkat menjadi **`Bagus`**.

---

## 💻 Panduan Menjalankan Program (How to Start)

Ikuti langkah-langkah di bawah ini untuk menjalankan *backend* di lingkungan lokal Anda:

### Prasyarat System
* PHP >= 8.2
* Composer
* PostgreSQL Database Server

### Langkah Instalasi

1. **Masuk ke folder backend**
   ```bash
   cd backend
   ```

2. **Install Dependensi PHP**
   ```bash
   composer install
   ```

3. **Konfigurasi Environment (`.env`)**
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan atur koneksi database PostgreSQL Anda:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=nama_database_anda
   DB_USERNAME=postgres
   DB_PASSWORD=password_database_anda
   ```

4. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

5. **Jalankan Migrasi Database & Seeder**
   Perintah ini akan membuat seluruh tabel dan mengisinya dengan data sampel awal (Admin, User, Teknisi, Gedung, Ruangan, Perangkat):
   ```bash
   php artisan migrate:fresh --seed
   ```

6. **Jalankan Server Lokal**
   ```bash
   php artisan serve
   ```
   Server backend akan berjalan di: `[http://127.0.0.1:8000](http://127.0.0.1:8000)`

---

## 🔑 Kredensial Pengujian (Default Seeders)

Seluruh akun demo menggunakan password bawaan: **`password123`**

| Role | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campuscare.com` | `password123` | Kelola master data (Gedung, Ruangan, Perangkat, User), Assign Teknisi |
| **Teknisi** | `teknisi1@campuscare.com`, `teknisi2@campuscare.com` | `password123` | Catat perbaikan & ubah status tiket pengaduan / maintenance |
| **User (Pelapor)** | `user1@campuscare.com`, `user2@campuscare.com` | `password123` | Buat laporan kerusakan & lihat riwayat tiket sendiri |

---

## 📡 Ringkasan Workflow & API Endpoints

    [User] POST /api/pengaduan          -> Buat laporan (Status Perangkat: Rusak)
       │
    [Admin] PUT /api/pengaduan/{id}/assign -> Tugaskan teknisi (Status Tiket: Diproses)
       │
    [Teknisi] PUT /api/pengaduan/{id}/perbaiki -> Input catatan perbaikan
       │
    [Teknisi] PUT /api/pengaduan/{id}/status   -> Ubah status Selesai (Status Perangkat: Bagus)
