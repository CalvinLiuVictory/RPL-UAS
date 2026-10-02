<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GedungController;
use App\Http\Controllers\RuanganController;
use App\Http\Controllers\PerangkatController;
use App\Http\Controllers\PengaduanController;
use App\Http\Controllers\MaintenanceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==========================================
// RUTE PUBLIK (Tanpa Token)
// ==========================================
Route::post('/login', [AuthController::class, 'login']);

// ==========================================
// RUTE TERPROTEKSI (Wajib Login & Bawa Bearer Token)
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {

    // Auth & Dashboard
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/dashboard', function (Request $request) {
        return response()->json([
            'message' => 'Selamat datang di Dashboard, ' . $request->user()->name,
            'user'    => $request->user()
        ]);
    });

    // ==========================================
    // KHUSUS ADMIN
    // ==========================================
    Route::middleware(['role:admin'])->group(function () {
        // Master Data CRUD Resources
        Route::apiResource('users', UserController::class);
        Route::apiResource('gedungs', GedungController::class);
        Route::apiResource('ruangans', RuanganController::class);
        Route::apiResource('perangkats', PerangkatController::class);
        
        // Fitur Pengaduan & Maintenance (Akses Admin)
        Route::put('/pengaduan/{id}/assign', [PengaduanController::class, 'assignTeknisi']);
        Route::post('/maintenance', [MaintenanceController::class, 'store']);
    });

    // ==========================================
    // KHUSUS USER / PELAPOR
    // ==========================================
    Route::middleware(['role:user'])->group(function () {
        Route::post('/pengaduan', [PengaduanController::class, 'store']);
    });

    // ==========================================
    // KHUSUS TEKNISI
    // ==========================================
    Route::middleware(['role:teknisi'])->group(function () {
        Route::put('/pengaduan/{id}/periksa', [PengaduanController::class, 'pemeriksaan']);
        Route::put('/pengaduan/{id}/perbaiki', [PengaduanController::class, 'catatPerbaikan']);
        Route::put('/pengaduan/{id}/status', [PengaduanController::class, 'updateStatus']);
        Route::put('/maintenance/{id}/catat', [MaintenanceController::class, 'catatMaintenance']);
    });

    // ==========================================
    // RUTE GABUNGAN (Filter Akses/Data di Controller)
    // ==========================================
    Route::get('/pengaduan', [PengaduanController::class, 'lihatPengaduan']);
    Route::get('/maintenance', [MaintenanceController::class, 'lihatMaintenance'])->middleware('role:admin,teknisi');

});