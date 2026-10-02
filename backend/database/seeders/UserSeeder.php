<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Akun Admin
        User::create([
            'name' => 'Admin Utama',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'admin'
        ]);

        // Akun Teknisi
        User::create([
            'name' => 'Teknisi AC',
            'email' => 'teknisi@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'teknisi'
        ]);

        // Akun User Biasa
        User::create([
            'name' => 'Pegawai Biasa',
            'email' => 'user@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'user'
        ]);
    }
}