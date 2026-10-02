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

   
