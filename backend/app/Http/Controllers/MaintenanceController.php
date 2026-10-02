<?php

namespace App\Http\Controllers;

use App\Models\Maintenance;
use App\Models\Perangkat;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    // GET /api/maintenance (Khusus Admin & Teknisi)
    public function lihatMaintenance(Request $request)
    {
        $user = $request->user();
        $query = Maintenance::with(['perangkat.ruangan.gedung', 'teknisi']);

        if ($user->role === 'teknisi') {
            // Teknisi hanya melihat jadwal maintenance milik dirinya
            $maintenance = $query->where('teknisi_id', $user->id)->latest()->get();
        } else {
            // Admin melihat seluruh jadwal maintenance
            $maintenance = $query->latest()->get();
        }

        return response()->json($maintenance, 200);
    }

    // POST /api/maintenance (Khusus Admin - Penjadwalan Maintenance Rutin)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'perangkat_id'        => 'required|exists:perangkats,id',
            'teknisi_id'          => 'required|exists:users,id',
            'tanggal_jadwal'     => 'required|date',
            'deskripsi_pekerjaan' => 'required|string',
        ]);

        $maintenance = Maintenance::create([
            'perangkat_id'        => $validated['perangkat_id'],
            'teknisi_id'          => $validated['teknisi_id'],
            'tanggal_jadwal'     => $validated['tanggal_jadwal'],
            'deskripsi_pekerjaan' => $validated['deskripsi_pekerjaan'],
            'status'              => 'Terjadwal',
        ]);

        // Ubah status perangkat menjadi 'Maintenance'
        Perangkat::where('id', $validated['perangkat_id'])->update(['status' => 'Maintenance']);

        return response()->json([
            'message' => 'Jadwal maintenance berhasil dibuat',
            'data'    => $maintenance->load(['perangkat', 'teknisi'])
        ], 201);
    }

    // PUT /api/maintenance/{id}/catat (Khusus Teknisi - Mencatat Hasil & Menyelesaikan Maintenance)
    public function catatMaintenance(Request $request, $id)
    {
        $validated = $request->validate([
            'catatan_hasil' => 'required|string',
            'status'        => 'required|in:Terjadwal,Selesai',
        ]);

        $maintenance = Maintenance::where('teknisi_id', $request->user()->id)->findOrFail($id);
        
        $maintenance->update([
            'catatan_hasil' => $validated['catatan_hasil'],
            'status'        => $validated['status'],
        ]);

        // Jika status sudah Selesai, kembalikan status perangkat ke 'Bagus'
        if ($validated['status'] === 'Selesai') {
            Perangkat::where('id', $maintenance->perangkat_id)->update(['status' => 'Bagus']);
        }

        return response()->json([
            'message' => 'Hasil maintenance berhasil dicatat',
            'data'    => $maintenance
        ], 200);
    }
}