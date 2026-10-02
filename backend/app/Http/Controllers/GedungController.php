<?php

namespace App\Http\Controllers;

use App\Models\Gedung;
use Illuminate\Http\Request;

class GedungController extends Controller
{
    public function index()
    {
        $gedung = Gedung::with('ruangans')->get();
        return response()->json($gedung, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_gedung' => 'required|string|max:255',
            'kode_gedung' => 'required|string|unique:gedungs,kode_gedung',
            'keterangan'  => 'nullable|string',
        ]);

        $gedung = Gedung::create($validated);

        return response()->json([
            'message' => 'Gedung berhasil ditambahkan',
            'data'    => $gedung
        ], 201);
    }

    public function show($id)
    {
        $gedung = Gedung::with('ruangans.perangkats')->find($id);

        if (!$gedung) {
            return response()->json(['message' => 'Gedung tidak ditemukan'], 404);
        }

        return response()->json($gedung, 200);
    }

    public function update(Request $request, $id)
    {
        $gedung = Gedung::find($id);

        if (!$gedung) {
            return response()->json(['message' => 'Gedung tidak ditemukan'], 404);
        }

        $validated = $request->validate([
            'nama_gedung' => 'sometimes|required|string|max:255',
            'kode_gedung' => 'sometimes|required|string|unique:gedungs,kode_gedung,' . $id,
            'keterangan'  => 'nullable|string',
        ]);

        $gedung->update($validated);

        return response()->json([
            'message' => 'Data gedung berhasil diperbarui',
            'data'    => $gedung
        ], 200);
    }

    public function destroy($id)
    {
        $gedung = Gedung::find($id);

        if (!$gedung) {
            return response()->json(['message' => 'Gedung tidak ditemukan'], 404);
        }

        $gedung->delete();

        return response()->json(['message' => 'Gedung berhasil dihapus'], 200);
    }
}