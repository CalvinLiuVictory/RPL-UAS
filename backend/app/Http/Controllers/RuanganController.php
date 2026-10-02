<?php

namespace App\Http\Controllers;

use App\Models\Ruangan;
use Illuminate\Http\Request;

class RuanganController extends Controller
{
    public function index()
    {
        // Mengambil seluruh ruangan beserta data gedungnya
        return response()->json(Ruangan::with('gedung')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'gedung_id'    => 'required|exists:gedungs,id',
            'nama_ruangan' => 'required|string'
        ]);

        $ruangan = Ruangan::create($request->all());

        return response()->json([
            'message' => 'Ruangan berhasil ditambahkan',
            'data'    => $ruangan->load('gedung')
        ], 201);
    }

    public function show($id)
    {
        $ruangan = Ruangan::with('gedung')->findOrFail($id);
        return response()->json($ruangan);
    }

    public function update(Request $request, $id)
    {
        $ruangan = Ruangan::findOrFail($id);
        
        $request->validate([
            'gedung_id'    => 'sometimes|exists:gedungs,id',
            'nama_ruangan' => 'sometimes|string'
        ]);

        $ruangan->update($request->all());

        return response()->json([
            'message' => 'Ruangan berhasil diperbarui',
            'data'    => $ruangan->load('gedung')
        ]);
    }

    public function destroy($id)
    {
        Ruangan::destroy($id);
        return response()->json(['message' => 'Ruangan berhasil dihapus']);
    }
}