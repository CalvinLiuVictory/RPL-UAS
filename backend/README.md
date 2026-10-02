🛠️ Service & Maintenance Management System APIAPI Backend berbasis RESTful untuk sistem manajemen pelaporan kerusakan dan perawatan fasilitas (Helpdesk & Maintenance) menggunakan Laravel 11, PostgreSQL, dan Laravel Sanctum.🚀 Fitur & Pencapaian yang Sudah SelesaiSistem ini telah selesai dibangun dan diverifikasi secara End-to-End (E2E) dengan cakupan logika bisnis sebagai berikut:1. Otentikasi & Hak Akses (RBAC)✅ Laravel Sanctum Authentication: Fitur Login dan Logout berbasis Token.✅ Role-Based Access Control Middleware: Proteksi endpoint terpisah berdasarkan 3 peran pengguna (Admin, User/Pelapor, dan Teknisi).2. Manajemen Entitas & Relasi✅ Gedung & Ruangan: Relasi One-to-Many dengan Eager Loading data ruangan.✅ Perangkat: Manajemen status perangkat (Bagus / Rusak).✅ Pengaduan & Maintenance: Pengelolaan tiket laporan dari pengajuan hingga penyelesaian.3. Otomatisasi Logika Bisnis (State Management)✅ User Melaporkan Kerusakan: Saat User membuat pengaduan, status tiket menjadi Menunggu dan status perangkat otomatis berubah menjadi Rusak.✅ Admin Menugaskan Teknisi: Admin menugaskan Teknisi tertentu, status tiket berubah menjadi Diproses.✅ Teknisi Memperbaiki: Teknisi mencatat deskripsi perbaikan dan menyelesaikan tiket (status Selesai), yang secara otomatis mengembalikan status perangkat menjadi Bagus.💻 Panduan Menjalankan Program (How to Start)Ikuti langkah-langkah di bawah ini untuk menjalankan backend di lingkungan lokal Anda:Prasyarat SystemPHP >= 8.2ComposerPostgreSQL Database ServerLangkah InstalasiMasuk ke folder backendBashcd backend
Install Dependensi PHPBashcomposer install
Konfigurasi Environment (.env)Salin file .env.example menjadi .env:Bashcp .env.example .env
Buka file .env dan atur koneksi database PostgreSQL Anda:Code snippetDB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=nama_database_anda
DB_USERNAME=postgres
DB_PASSWORD=password_database_anda
Generate Application KeyBashphp artisan key:generate
Jalankan Migrasi Database & SeederPerintah ini akan membuat seluruh tabel dan mengisinya dengan data sampel awal (Admin, User, Teknisi, Gedung, Ruangan, Perangkat):Bashphp artisan migrate:fresh --seed
Jalankan Server LokalBashphp artisan serve
Server backend akan berjalan di: [http://127.0.0.1:8000](http://127.0.0.1:8000)🔑 Kredensial Pengujian (Default Seeders)Seluruh akun demo menggunakan password bawaan: password123RoleEmailHak Akses UtamaAdminadmin@gmail.comMengelola data master (Gedung, Perangkat), Menugaskan Teknisi (Assign)User (Pelapor)user@gmail.comMembuat Pengaduan Kerusakan, Melihat Riwayat Pengaduan SendiriTeknisiteknisi@gmail.comMenginput Catatan Perbaikan, Mengubah Status Pengaduan menjadi Selesai📡 Ringkasan Workflow & API EndpointsPlaintext[User] POST /api/pengaduan          -> Buat laporan (Status Perangkat: Rusak)
   │
[Admin] PUT /api/pengaduan/{id}/assign -> Tugaskan teknisi (Status Tiket: Diproses)
   │
[Teknisi] PUT /api/pengaduan/{id}/perbaiki -> Input catatan perbaikan
   │
[Teknisi] PUT /api/pengaduan/{id}/status   -> Ubah status Selesai (Status Perangkat: Bagus)