<?php

namespace App\Http\Controllers;

use App\Models\Perangkat;
use Illuminate\Http\Request;

class PerangkatController extends Controller
{
    public function index()
    {
        // Mengambil perangkat beserta info ruangan dan gedungnya
        return response()->json(Perangkat::with('ruangan.gedung')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'ruangan_id'     => 'required|exists:ruangans,id',
            'kode_aset'      => 'required|string|unique:perangkats,kode_aset',
            'nama_perangkat' => 'required|string',
            'status'         => 'nullable|in:Bagus,Rusak,Maintenance'
        ]);

        $perangkat = Perangkat::create($validated);

        return response()->json([
            'message' => 'Perangkat berhasil ditambahkan',
            'data'    => $perangkat->load('ruangan.gedung')
        ], 201);
    }

    public function show($id)
    {
        $perangkat = Perangkat::with('ruangan.gedung')->findOrFail($id);
        return response()->json($perangkat);
    }

    public function update(Request $request, $id)
    {
        $perangkat = Perangkat::findOrFail($id);

        $validated = $request->validate([
            'ruangan_id'     => 'sometimes|exists:ruangans,id',
            'kode_aset'      => 'sometimes|string|unique:perangkats,kode_aset,' . $id,
            'nama_perangkat' => 'sometimes|string',
            'status'         => 'sometimes|in:Bagus,Rusak,Maintenance'
        ]);

        $perangkat->update($validated);

        return response()->json([
            'message' => 'Perangkat berhasil diperbarui',
            'data'    => $perangkat->load('ruangan.gedung')
        ]);
    }

    public function destroy($id)
    {
        Perangkat::destroy($id);
        return response()->json(['message' => 'Perangkat berhasil dihapus']);
    }
}