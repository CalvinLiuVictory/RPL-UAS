# CampusCare Database Schema Documentation

Berkas ini mendokumentasikan arsitektur dan struktur skema tabel Supabase PostgreSQL yang digunakan oleh CampusCare Node.js Express backend.

## 📋 Daftar Tabel Utama

1. **`users`**: Menyimpan data akun pengguna dan peran (`admin`, `teknisi`, `user`).
2. **`gedungs`**: Master data gedung kampus (mis. Gedung Rektorat, Gedung Lab Komputer).
3. **`ruangans`**: Master data ruangan terkait gedung (`gedung_id`).
4. **`perangkats`**: Master data perangkat/inventaris di dalam ruangan (`ruangan_id`) beserta status (`Bagus`, `Rusak`, `Maintenance`).
5. **`pengaduans`**: Tiket pengaduan kerusakan fasilitas dari pengguna (`user_id`), ditugaskan ke teknisi (`teknisi_id`), dengan status (`Menunggu`, `Diproses`, `Selesai`).
6. **`maintenances`**: Jadwal dan log pemeliharaan preventif/rutin oleh teknisi.
7. **`personal_access_tokens`**: Token autentikasi berbasis SHA-256 yang kompatibel dengan format Sanctum (`id|plaintext`) dengan masa aktif dinamis (`expires_at`).
8. **`login_attempts`**: Tabel pembatas laju (rate limiting) atomik multi-kunci berbasis PostgreSQL (`INSERT ... ON CONFLICT DO UPDATE`).

## 🛡️ Indeks Unik Parsial (Race Condition Guard)
Untuk mencegah duplikasi tiket saat pengguna menekan tombol kirim secara serentak, dibuat indeks parsial:
```sql
CREATE UNIQUE INDEX idx_pengaduans_active_user_device 
ON pengaduans(user_id, perangkat_id) 
WHERE status IN ('Menunggu', 'Diproses');
```

## 🔄 Pemulihan Skema
Skema lengkap tanpa data dapat dipelajari atau diimpor ulang melalui berkas [schema.sql](./schema.sql).
