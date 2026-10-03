import db from '../src/db.js';

async function runFase1() {
  console.log('=== FASE 1: RAPIKAN DATA UJI ===\n');

  // 1.1 Row counts BEFORE
  const beforeCounts = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM pengaduans) AS pengaduans,
      (SELECT COUNT(*) FROM perangkats) AS perangkats,
      (SELECT COUNT(*) FROM maintenances) AS maintenances,
      (SELECT COUNT(*) FROM personal_access_tokens) AS personal_access_tokens,
      (SELECT COUNT(*) FROM login_attempts) AS login_attempts
  `);
  console.log('1.1 Jumlah Baris SEBELUM Pembersihan:');
  console.table(beforeCounts.rows[0]);

  // 1.2 Cleanup test complaints & ensure complaint 3 is 'Selesai'
  const delTest = await db.query(`
    DELETE FROM pengaduans 
    WHERE deskripsi ILIKE '%QA%' OR deskripsi ILIKE '%Test%'
    RETURNING id, deskripsi
  `);
  console.log('1.2 Komplain uji yang dihapus:', delTest.rows.length > 0 ? delTest.rows : 'Tidak ada (sudah bersih)');

  await db.query(`UPDATE pengaduans SET status = 'Selesai' WHERE id = 3`);
  console.log('    Status komplain id 3 dipastikan: Selesai');

  // Delete test/expired login_attempts (> 10 minutes)
  const delAttempts = await db.query(`
    DELETE FROM login_attempts
    WHERE EXTRACT(EPOCH FROM (NOW() - window_start)) > 600
    RETURNING key
  `);
  console.log('    Login attempts kedaluwarsa dibersihkan:', delAttempts.rows.length);

  // Delete test tokens created by our test runs
  const delTokens = await db.query(`
    DELETE FROM personal_access_tokens
    WHERE name = 'test_expired' OR name = 'test_token'
    RETURNING id
  `);
  console.log('    Token uji spesifik dibersihkan:', delTokens.rows.length);

  // 1.3 Recalculate device status
  console.log('\n1.3 Menghitung Ulang Status Seluruh Perangkat:');
  const devs = await db.query('SELECT id, kode_aset, nama_perangkat, status FROM perangkats ORDER BY id');
  const changedDevices = [];

  for (const dev of devs.rows) {
    const activeComplaints = await db.query(
      "SELECT id FROM pengaduans WHERE perangkat_id = $1 AND status IN ('Menunggu', 'Diproses')",
      [dev.id]
    );

    const activeMaintenances = await db.query(
      "SELECT id FROM maintenances WHERE perangkat_id = $1 AND status = 'Terjadwal'",
      [dev.id]
    );

    let expectedStatus = 'Bagus';
    if (activeComplaints.rows.length > 0) {
      expectedStatus = 'Rusak';
    } else if (activeMaintenances.rows.length > 0) {
      expectedStatus = 'Maintenance';
    }

    if (dev.status !== expectedStatus) {
      await db.query('UPDATE perangkats SET status = $1, updated_at = NOW() WHERE id = $2', [
        expectedStatus,
        dev.id
      ]);
      changedDevices.push({
        id: dev.id,
        kode_aset: dev.kode_aset,
        nama: dev.nama_perangkat,
        status_lama: dev.status,
        status_baru: expectedStatus
      });
    }
  }

  if (changedDevices.length > 0) {
    console.log('    Daftar perangkat yang berubah statusnya:');
    console.table(changedDevices);
  } else {
    console.log('    Semua status perangkat (12 perangkat) SUDAH SESUAI dan KONSISTEN (0 perangkat berubah).');
    const finalDevs = await db.query('SELECT id, kode_aset, nama_perangkat, status FROM perangkats ORDER BY id');
    console.table(finalDevs.rows);
  }

  // 1.4 Anomali Race Condition & Indeks Parsial
  console.log('\n1.4 Verifikasi Indeks Parsial & Race Condition Guard:');
  const idxCheck = await db.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'pengaduans' AND indexname = 'idx_pengaduans_active_user_device'
  `);
  console.log('    Index di pg_indexes:');
  console.log('    ', idxCheck.rows[0]?.indexdef || 'TIDAK DITEMUKAN!');

  const activeCheck = await db.query(`
    SELECT COUNT(*) AS total_aktif 
    FROM pengaduans 
    WHERE user_id = 4 AND perangkat_id = 1 AND status IN ('Menunggu', 'Diproses')
  `);
  console.log('    Jumlah baris aktif untuk (user_id=4, perangkat_id=1):', activeCheck.rows[0].total_aktif);

  // 1.5 Row counts AFTER
  const afterCounts = await db.query(`
    SELECT 
      (SELECT COUNT(*) FROM pengaduans) AS pengaduans,
      (SELECT COUNT(*) FROM perangkats) AS perangkats,
      (SELECT COUNT(*) FROM maintenances) AS maintenances,
      (SELECT COUNT(*) FROM personal_access_tokens) AS personal_access_tokens,
      (SELECT COUNT(*) FROM login_attempts) AS login_attempts
  `);
  console.log('\n1.5 Jumlah Baris SESUDAH Pembersihan:');
  console.table(afterCounts.rows[0]);

  process.exit(0);
}

runFase1().catch(err => {
  console.error('Error running Fase 1:', err);
  process.exit(1);
});
