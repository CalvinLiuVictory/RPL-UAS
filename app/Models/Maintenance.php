<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Maintenance extends Model
{
    protected $fillable = [
        'perangkat_id', 'teknisi_id', 'tanggal_jadwal', 'deskripsi_pekerjaan', 'status', 'catatan_hasil'
    ];

    public function perangkat()
    {
        return $this->belongsTo(Perangkat::class);
    }

    public function teknisi()
    {
        return $this->belongsTo(User::class, 'teknisi_id');
    }
}