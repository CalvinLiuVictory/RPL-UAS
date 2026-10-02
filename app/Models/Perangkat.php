<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Perangkat extends Model
{
    protected $fillable = ['ruangan_id', 'kode_aset', 'nama_perangkat', 'status'];

    public function ruangan()
    {
        return $this->belongsTo(Ruangan::class);
    }
}