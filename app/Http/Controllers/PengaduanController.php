<?php

namespace App\Http\Controllers;

use App\Models\Pengaduan;
use App\Models\Perangkat;
use Illuminate\Http\Request;

class PengaduanController extends Controller
{
    // GET /api/pengaduan (Filter data berdasarkan Role User)
    public function lihatPengaduan(Request $request)
    {
        $user = $request->user();
        $query = Pengaduan::with(['user', 'perangkat.ruangan.gedung', 'teknisi']);

        if ($user->role === 'user') {
            // User biasa hanya melihat pengaduan miliknya sendiri
            $pengaduan = $query->where('user_id', $user->id)->latest()->get();
        } elseif ($user->role === 'teknisi') {
            // Teknisi hanya melihat pengaduan yang ditugaskan kepadanya
            $pengaduan = $query->where('teknisi_id', $user->id)->latest()->get();
        } else {
            // Admin melihat semua pengaduan
            $pengaduan = $query->latest()->get();
        }

        return response()->json($pengaduan, 200);
    }

    // POST /api/pengaduan (Khusus Role User - Melaporkan Kerusakan)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'perangkat_id' => 'required|exists:perangkats,id',
            'deskripsi'    => 'required|string',
        ]);

        $pengaduan = Pengaduan::create([
            'user_id'      => $request->user()->id,
            'perangkat_id' => $validated['perangkat_id'],
            'deskripsi'    => $validated['deskripsi'],
            'status'       => 'Menunggu',
        ]);

        // Otomatis ubah status perangkat menjadi 'Rusak'
        Perangkat::where('id', $validated['perangkat_id'])->update(['status' => 'Rusak']);

        return response()->json([
            'message' => 'Pengaduan berhasil dibuat',
            'data'    => $pengaduan->load('perangkat')
        ], 201);
    }

    // PUT /api/pengaduan/{id}/assign (Khusus Admin - Menugaskan Teknisi)
    public function assignTeknisi(Request $request, $id)
    {
        $validated = $request->validate([
            'teknisi_id' => 'required|exists:users,id',
        ]);

        $pengaduan = Pengaduan::findOrFail($id);
        $pengaduan->update([
            'teknisi_id' => $validated['teknisi_id'],
            'status'     => 'Diproses',
        ]);

        return response()->json([
            'message' => 'Teknisi berhasil ditugaskan',
            'data'    => $pengaduan->load(['teknisi', 'perangkat'])
        ], 200);
    }

    // PUT /api/pengaduan/{id}/periksa (Khusus Teknisi - Catatan Awal Pemeriksaan)
    public function pemeriksaan(Request $request, $id)
    {
        $validated = $request->validate([
            'catatan_teknisi' => 'required|string',
        ]);

        $pengaduan = Pengaduan::where('teknisi_id', $request->user()->id)->findOrFail($id);
        $pengaduan->update([
            'catatan_teknisi' => '[Pemeriksaan]: ' . $validated['catatan_teknisi'],
            'status'          => 'Diproses',
        ]);

        return response()->json([
            'message' => 'Catatan pemeriksaan berhasil disimpan',
            'data'    => $pengaduan
        ], 200);
    }

    // PUT /api/pengaduan/{id}/perbaiki (Khusus Teknisi - Catat Perbaikan)
    public function catatPerbaikan(Request $request, $id)
    {
        $validated = $request->validate([
            'catatan_teknisi' => 'required|string',
        ]);

        $pengaduan = Pengaduan::where('teknisi_id', $request->user()->id)->findOrFail($id);
        $pengaduan->update([
            'catatan_teknisi' => $pengaduan->catatan_teknisi . "\n[Perbaikan]: " . $validated['catatan_teknisi'],
        ]);

        return response()->json([
            'message' => 'Catatan perbaikan berhasil ditambahkan',
            'data'    => $pengaduan
        ], 200);
    }

    // PUT /api/pengaduan/{id}/status (Khusus Teknisi - Mengubah Status Akhir)
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Menunggu,Diproses,Selesai',
        ]);

        $pengaduan = Pengaduan::where('teknisi_id', $request->user()->id)->findOrFail($id);
        $pengaduan->update(['status' => $validated['status']]);

        // Jika perbaikan Selesai, kembalikan status perangkat menjadi 'Bagus'
        if ($validated['status'] === 'Selesai') {
            Perangkat::where('id', $pengaduan->perangkat_id)->update(['status' => 'Bagus']);
        }

        return response()->json([
            'message' => 'Status pengaduan berhasil diperbarui',
            'data'    => $pengaduan
        ], 200);
    }
}