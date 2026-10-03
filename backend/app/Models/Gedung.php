<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Gedung extends Model
{
    protected $fillable = [
        'kode_gedung',
        'nama_gedung',
        'keterangan',
    ];

    public function ruangans()
    {
        return $this->hasMany(Ruangan::class);
    }
}