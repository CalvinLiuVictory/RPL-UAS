<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Gedung;
use App\Models\Ruangan;
use App\Models\Perangkat;
use App\Models\Pengaduan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // -------------------------------------------------------------
        // 1. SEED USERS (Admin, Teknisi, Mahasiswa/Pelapor)
        // -------------------------------------------------------------
        // 1 User Admin
        $admin = User::create([
            'name'     => 'Admin CampusCare',
            'email'    => 'admin@campuscare.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        // 2 User Teknisi
        $teknisi1 = User::create([
            'name'     => 'Teknisi Satu',
            'email'    => 'teknisi1@campuscare.com',
            'password' => Hash::make('password123'),
            'role'     => 'teknisi',
        ]);

        $teknisi2 = User::create([
            'name'     => 'Teknisi Dua',
            'email'    => 'teknisi2@campuscare.com',
            'password' => Hash::make('password123'),
            'role'     => 'teknisi',
        ]);

        // 2 User Mahasiswa / Pelapor
        $user1 = User::create([
            'name'     => 'Mahasiswa Pelapor 1',
            'email'    => 'user1@campuscare.com',
            'password' => Hash::make('password123'),
            'role'     => 'user',
        ]);

        $user2 = User::create([
            'name'     => 'Mahasiswa Pelapor 2',
            'email'    => 'user2@campuscare.com',
            'password' => Hash::make('password123'),
            'role'     => 'user',
        ]);

        // -------------------------------------------------------------
        // 2. SEED GEDUNG & RUANGAN (2 Gedung, masing-masing 2 Ruangan)
        // -------------------------------------------------------------
        // Gedung 1: Rektorat & Administrasi
        $gedungA = Gedung::create([
            'kode_gedung' => 'GDG-A',
            'nama_gedung' => 'Gedung Rektorat & Administrasi',
            'keterangan'  => 'Pusat kegiatan administrasi dan pelayanan akademik kampus',
        ]);

        $ruanganA1 = Ruangan::create([
            'gedung_id'    => $gedungA->id,
            'nama_ruangan' => 'Ruang Pelayanan Akademik 101',
        ]);

        $ruanganA2 = Ruangan::create([
            'gedung_id'    => $gedungA->id,
            'nama_ruangan' => 'Ruang Administrasi Umum 102',
        ]);

        // Gedung 2: Laboratorium Terpadu
        $gedungB = Gedung::create([
            'kode_gedung' => 'GDG-B',
            'nama_gedung' => 'Gedung Laboratorium Komputer',
            'keterangan'  => 'Fasilitas praktikum komputasi, multimedia, dan riset',
        ]);

        $ruanganB1 = Ruangan::create([
            'gedung_id'    => $gedungB->id,
            'nama_ruangan' => 'Lab Rekayasa Perangkat Lunak 201',
        ]);

        $ruanganB2 = Ruangan::create([
            'gedung_id'    => $gedungB->id,
            'nama_ruangan' => 'Lab Jaringan & IoT 202',
        ]);

        // -------------------------------------------------------------
        // 3. SEED PERANGKAT (Minimal 3 Perangkat di setiap Ruangan)
        // -------------------------------------------------------------
        // Perangkat di Ruangan A1 (Ruang Pelayanan Akademik 101)
        $perangkatA1_1 = Perangkat::create([
            'ruangan_id'     => $ruanganA1->id,
            'kode_aset'      => 'AST-A1-001',
            'nama_perangkat' => 'PC Desktop Pelayanan 1',
            'status'         => 'Bagus',
        ]);

        $perangkatA1_2 = Perangkat::create([
            'ruangan_id'     => $ruanganA1->id,
            'kode_aset'      => 'AST-A1-002',
            'nama_perangkat' => 'Printer Laser Multi-Fungsi HP',
            'status'         => 'Bagus',
        ]);

        $perangkatA1_3 = Perangkat::create([
            'ruangan_id'     => $ruanganA1->id,
            'kode_aset'      => 'AST-A1-003',
            'nama_perangkat' => 'AC Split Daikin 1.5 PK',
            'status'         => 'Rusak', // Ada pengaduan 'Menunggu'
        ]);

        // Perangkat di Ruangan A2 (Ruang Administrasi Umum 102)
        $perangkatA2_1 = Perangkat::create([
            'ruangan_id'     => $ruanganA2->id,
            'kode_aset'      => 'AST-A2-001',
            'nama_perangkat' => 'Proyektor Epson EB-X500',
            'status'         => 'Bagus',
        ]);

        $perangkatA2_2 = Perangkat::create([
            'ruangan_id'     => $ruanganA2->id,
            'kode_aset'      => 'AST-A2-002',
            'nama_perangkat' => 'Switch Hub Cisco 24 Port',
            'status'         => 'Rusak', // Ada pengaduan 'Diproses'
        ]);

        $perangkatA2_3 = Perangkat::create([
            'ruangan_id'     => $ruanganA2->id,
            'kode_aset'      => 'AST-A2-003',
            'nama_perangkat' => 'Document Scanner Fujitsu fi-7160',
            'status'         => 'Bagus',
        ]);

        // Perangkat di Ruangan B1 (Lab Rekayasa Perangkat Lunak 201)
        $perangkatB1_1 = Perangkat::create([
            'ruangan_id'     => $ruanganB1->id,
            'kode_aset'      => 'AST-B1-001',
            'nama_perangkat' => 'PC Workstation Lab 01',
            'status'         => 'Bagus',
        ]);

        $perangkatB1_2 = Perangkat::create([
            'ruangan_id'     => $ruanganB1->id,
            'kode_aset'      => 'AST-B1-002',
            'nama_perangkat' => 'PC Workstation Lab 02',
            'status'         => 'Bagus',
        ]);

        $perangkatB1_3 = Perangkat::create([
            'ruangan_id'     => $ruanganB1->id,
            'kode_aset'      => 'AST-B1-003',
            'nama_perangkat' => 'AC Sentral Lab 2 PK',
            'status'         => 'Bagus', // Pengaduan sudah 'Selesai'
        ]);

        // Perangkat di Ruangan B2 (Lab Jaringan & IoT 202)
        $perangkatB2_1 = Perangkat::create([
            'ruangan_id'     => $ruanganB2->id,
            'kode_aset'      => 'AST-B2-001',
            'nama_perangkat' => 'Router Mikrotik CCR1009',
            'status'         => 'Bagus',
        ]);

        $perangkatB2_2 = Perangkat::create([
            'ruangan_id'     => $ruanganB2->id,
            'kode_aset'      => 'AST-B2-002',
            'nama_perangkat' => 'Access Point UniFi U6-Pro',
            'status'         => 'Bagus',
        ]);

        $perangkatB2_3 = Perangkat::create([
            'ruangan_id'     => $ruanganB2->id,
            'kode_aset'      => 'AST-B2-003',
            'nama_perangkat' => 'Smart TV LG 65 Inch Presentation',
            'status'         => 'Bagus',
        ]);

        // -------------------------------------------------------------
        // 4. SEED PENGADUAN (3 Status: Menunggu, Diproses, Selesai)
        // -------------------------------------------------------------
        // 1. Status 'Menunggu' (Belum ditugaskan ke teknisi)
        Pengaduan::create([
            'user_id'         => $user1->id,
            'perangkat_id'    => $perangkatA1_3->id,
            'deskripsi'       => 'AC di Ruang Pelayanan Akademik 101 tidak dingin dan berbunyi bising sejak pagi.',
            'status'          => 'Menunggu',
            'teknisi_id'      => null,
            'catatan_teknisi' => null,
        ]);

        // 2. Status 'Diproses' (Ditugaskan ke Teknisi 1)
        Pengaduan::create([
            'user_id'         => $user2->id,
            'perangkat_id'    => $perangkatA2_2->id,
            'deskripsi'       => 'Koneksi jaringan LAN di ruang 102 mati total, lampu indikator switch berkedip merah.',
            'status'          => 'Diproses',
            'teknisi_id'      => $teknisi1->id,
            'catatan_teknisi' => '[Pemeriksaan]: Sedang dilakukan pengujian modul power supply switch dan pengetesan kabel trunk.',
        ]);

        // 3. Status 'Selesai' (Ditugaskan ke Teknisi 2 dan telah selesai diperbaiki)
        Pengaduan::create([
            'user_id'         => $user1->id,
            'perangkat_id'    => $perangkatB1_3->id,
            'deskripsi'       => 'AC di Lab 201 sering mati mendadak setelah 15 menit beroperasi.',
            'status'          => 'Selesai',
            'teknisi_id'      => $teknisi2->id,
            'catatan_teknisi' => "[Pemeriksaan]: Kapasitor fan motor lemah dan filter udara tersumbat debu tebal.\n[Perbaikan]: Penggantian kapasitor 2.5uF dan pencucian kompresor indoor/outdoor selesai. Suhu kembali dingin stabil.",
        ]);
    }
}