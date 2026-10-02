<?php

namespace App\Http\Controllers;

use App\Models\Gedung;
use Illuminate\Http\Request;

class GedungController extends Controller
{
    // Menampilkan semua data gedung
    public function index()
    {
        return response()->json(Gedung::all());
    }

    // Menambah data gedung baru
    public function store(Request $request)
    {
        $request->validate([
            'nama_gedung' => 'required|string|unique:gedungs,nama_gedung'
        ]);

        $gedung = Gedung::create($request->all());

        return response()->json([
            'message' => 'Gedung berhasil ditambahkan',
            'data' => $gedung
        ], 201);
    }

    // Menampilkan satu data gedung spesifik
    public function show($id)
    {
        $gedung = Gedung::findOrFail($id);
        return response()->json($gedung);
    }

    // Mengubah data gedung
    public function update(Request $request, $id)
    {
        $gedung = Gedung::findOrFail($id);
        $gedung->update($request->all());

        return response()->json([
            'message' => 'Gedung berhasil diperbarui',
            'data' => $gedung
        ]);
    }

    // Menghapus data gedung
    public function destroy($id)
    {
        Gedung::destroy($id);
        return response()->json(['message' => 'Gedung berhasil dihapus']);
    }
}