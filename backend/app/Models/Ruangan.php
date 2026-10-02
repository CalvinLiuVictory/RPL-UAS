<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ruangan extends Model
{
    protected $fillable = ['gedung_id', 'nama_ruangan'];

    public function gedung()
    {
        return $this->belongsTo(Gedung::class);
    }

    public function perangkats()
    {
        return $this->hasMany(Perangkat::class);
    }
}