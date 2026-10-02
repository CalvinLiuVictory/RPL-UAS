<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pengaduan extends Model
{
    protected $fillable = [
        'user_id', 'perangkat_id', 'deskripsi', 'status', 'teknisi_id', 'catatan_teknisi'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function perangkat()
    {
        return $this->belongsTo(Perangkat::class);
    }

    public function teknisi()
    {
        return $this->belongsTo(User::class, 'teknisi_id');
    }
}