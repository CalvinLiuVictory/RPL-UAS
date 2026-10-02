<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Gedung;
use App\Models\Ruangan;
use App\Models\Perangkat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users (Admin, User/Pelapor, Teknisi)
        User::create([
            'name'     => 'Admin Utama',
            'email'    => 'admin@gmail.com',
            'password' => Hash::make('password123'),
            'role'     => 'admin',
        ]);

        $pelapor = User::create([
            'name'     => 'Budi Pelapor',
            'email'    => 'user@gmail.com',
            'password' => Hash::make('password123'),
            'role'     => 'user',
        ]);

        $teknisi = User::create([
            'name'     => 'Andi Teknisi',
            'email'    => 'teknisi@gmail.com',
            'password' => Hash::make('password123'),
            'role'     => 'teknisi',
        ]);

       // 2. Seed Master Data (Gedung, Ruangan, Perangkat)
        $gedung = Gedung::create([
            'nama_gedung' => 'Gedung Utama',
        ]);

        $ruangan = Ruangan::create([
            'gedung_id'    => $gedung->id,
            'nama_ruangan' => 'Ruang IT Support',
        ]);

        Perangkat::create([
            'ruangan_id'     => $ruangan->id,
            'kode_aset'      => 'AST-PC-001',
            'nama_perangkat' => 'PC Workstation',
            'status'         => 'Bagus'
        ]);
    }
}