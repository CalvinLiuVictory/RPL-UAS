import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

const API_BASE = process.env.API_URL || 'http://localhost:8000/api';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.pvzltsqlwiffzxjeaoaa:Benaya*357%23@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const createdTokenIds = [];

async function loginUser(email, password = 'password123') {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data?.access_token) {
    const id = data.access_token.split('|')[0];
    if (id) createdTokenIds.push(id);
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('     CAMPUSCARE BACKEND-NODE SECURITY & ROBUSTNESS TEST SUITE     ');
  console.log('================================================================\n');

  // --- Login users to get tokens ---
  console.log('[Setup] Logging in users to obtain valid tokens...');
  const adminLogin = await loginUser('admin@campuscare.com');
  const adminToken = adminLogin.data.access_token;
  console.log('  Admin token obtained. Status:', adminLogin.status);

  const tek1Login = await loginUser('teknisi1@campuscare.com');
  const tek1Token = tek1Login.data.access_token;
  console.log('  Teknisi 1 token obtained. Status:', tek1Login.status);

  const tek2Login = await loginUser('teknisi2@campuscare.com');
  const tek2Token = tek2Login.data.access_token;
  console.log('  Teknisi 2 token obtained. Status:', tek2Login.status);

  const user1Login = await loginUser('user1@campuscare.com');
  const user1Token = user1Login.data.access_token;
  console.log('  User 1 token obtained. Status:', user1Login.status);

  const user2Login = await loginUser('user2@campuscare.com');
  const user2Token = user2Login.data.access_token;
  console.log('  User 2 token obtained. Status:', user2Login.status);
  console.log();

  // ====================================================================
  // TEST A.1: Token Kedaluwarsa (> 24 jam)
  // ====================================================================
  console.log('=== TEST A.1: Token Kedaluwarsa (> 24 jam) ===');
  const plainExpiredToken = crypto.randomBytes(20).toString('hex');
  const hashExpiredToken = crypto.createHash('sha256').update(plainExpiredToken).digest('hex');
  const expInsert = await pool.query(`
    INSERT INTO personal_access_tokens (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
    VALUES ($1, $2, 'test_expired', $3, '["*"]', NOW() - INTERVAL '25 hours', NOW() - INTERVAL '25 hours')
    RETURNING id
  `, ['App\\Models\\User', 4, hashExpiredToken]);
  const expTokenId = expInsert.rows[0].id;
  const expiredAuthHeader = `Bearer ${expTokenId}|${plainExpiredToken}`;

  const curlA1 = `curl -s -i -X GET ${API_BASE}/me -H "Authorization: ${expiredAuthHeader}" -H "Accept: application/json"`;
  const outA1 = execSync(curlA1).toString();
  console.log(outA1);

  // Clean up test token
  await pool.query('DELETE FROM personal_access_tokens WHERE id = $1', [expTokenId]);

  // ====================================================================
  // TEST A.2: CORS (Origin asing vs FRONTEND_URL)
  // ====================================================================
  console.log('\n=== TEST A.2: CORS (Origin asing vs FRONTEND_URL) ===');
  console.log('--- 2a. Origin Asing: https://contoh-lain.com ---');
  const curlA2a = `curl -s -i -X OPTIONS ${API_BASE}/health -H "Origin: https://contoh-lain.com" -H "Access-Control-Request-Method: GET"`;
  const outA2a = execSync(curlA2a).toString();
  console.log(outA2a);

  console.log('--- 2b. Origin Resmi: https://rpl-uts.vercel.app ---');
  const curlA2b = `curl -s -i -X OPTIONS ${API_BASE}/health -H "Origin: https://rpl-uts.vercel.app" -H "Access-Control-Request-Method: GET"`;
  const outA2b = execSync(curlA2b).toString();
  console.log(outA2b);

  // ====================================================================
  // TEST A.3: Mass Assignment ("role":"admin" pada endpoint non-admin)
  // ====================================================================
  console.log('\n=== TEST A.3: Mass Assignment ("role":"admin" pada endpoint non-admin) ===');
  const curlA3 = `curl -s -i -X POST ${API_BASE}/pengaduan \\
    -H "Authorization: Bearer ${user1Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"perangkat_id": 1, "deskripsi": "QA Mass Assignment Test", "role": "admin", "status": "Selesai"}'`;
  const outA3 = execSync(curlA3).toString();
  console.log(outA3);

  // Parse ID to delete immediately
  const jsonA3 = JSON.parse(outA3.split('\r\n\r\n')[1] || outA3.split('\n\n')[1]);
  if (jsonA3?.data?.id) {
    await pool.query('DELETE FROM pengaduans WHERE id = $1', [jsonA3.data.id]);
    await pool.query('UPDATE perangkats SET status = $1 WHERE id = 1', ['Bagus']);
  }
  // Verify user 4 is still user role
  const checkUser4 = await pool.query('SELECT id, name, role FROM users WHERE id = 4');
  console.log('User Role in DB:', checkUser4.rows[0]);

  // ====================================================================
  // TEST A.4: IDOR User (User 1 mengakses/mengubah/menghapus komplain User 2)
  // ====================================================================
  console.log('\n=== TEST A.4: IDOR User (User 1 vs Komplain User 2: id=2) ===');
  console.log('--- 4a. User 1 GET /api/pengaduan (Komplain 2 milik User 2 tidak boleh muncul) ---');
  const curlA4a = `curl -s -i -X GET ${API_BASE}/pengaduan -H "Authorization: Bearer ${user1Token}" -H "Accept: application/json"`;
  const outA4a = execSync(curlA4a).toString();
  console.log(outA4a);

  console.log('--- 4b. User 1 mencoba PUT /api/pengaduan/2/status (Harus ditolak: 403 Forbidden) ---');
  const curlA4b = `curl -s -i -X PUT ${API_BASE}/pengaduan/2/status \\
    -H "Authorization: Bearer ${user1Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"status": "Selesai"}'`;
  const outA4b = execSync(curlA4b).toString();
  console.log(outA4b);

  console.log('--- 4c. User 1 mencoba DELETE /api/pengaduan/2 (Harus ditolak: 404 Not Found) ---');
  const curlA4c = `curl -s -i -X DELETE ${API_BASE}/pengaduan/2 -H "Authorization: Bearer ${user1Token}" -H "Accept: application/json"`;
  const outA4c = execSync(curlA4c).toString();
  console.log(outA4c);

  // ====================================================================
  // TEST A.5: IDOR Teknisi (Teknisi 2 mengubah tugas Teknisi 1)
  // ====================================================================
  console.log('\n=== TEST A.5: IDOR Teknisi (Teknisi 2 mengubah tugas Teknisi 1: komplain 2) ===');
  console.log('--- 5a. Teknisi 2 PUT /api/pengaduan/2/status (Harus ditolak: 404) ---');
  const curlA5a = `curl -s -i -X PUT ${API_BASE}/pengaduan/2/status \\
    -H "Authorization: Bearer ${tek2Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"status": "Diproses"}'`;
  const outA5a = execSync(curlA5a).toString();
  console.log(outA5a);

  console.log('--- 5b. Teknisi 2 PUT /api/pengaduan/2/periksa (Harus ditolak: 404) ---');
  const curlA5b = `curl -s -i -X PUT ${API_BASE}/pengaduan/2/periksa \\
    -H "Authorization: Bearer ${tek2Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"catatan_teknisi": "Pemeriksaan liar oleh Teknisi 2"}'`;
  const outA5b = execSync(curlA5b).toString();
  console.log(outA5b);

  console.log('--- 5c. Teknisi 2 PUT /api/pengaduan/2/perbaiki (Harus ditolak: 404) ---');
  const curlA5c = `curl -s -i -X PUT ${API_BASE}/pengaduan/2/perbaiki \\
    -H "Authorization: Bearer ${tek2Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"catatan_teknisi": "Perbaikan liar oleh Teknisi 2"}'`;
  const outA5c = execSync(curlA5c).toString();
  console.log(outA5c);

  console.log('--- 5d. Teknisi 2 PUT /api/maintenance/:id/catat pada tugas Teknisi 1 (Harus ditolak: 404) ---');
  // Create maintenance assigned to Teknisi 1 (id: 2)
  const maintInsert = await pool.query(`
    INSERT INTO maintenances (perangkat_id, teknisi_id, tanggal_jadwal, deskripsi_pekerjaan, status, created_at, updated_at)
    VALUES (1, 2, '2026-10-10', 'Maintenance Rutin Teknisi 1', 'Terjadwal', NOW(), NOW())
    RETURNING id
  `);
  const maintId = maintInsert.rows[0].id;

  const curlA5d = `curl -s -i -X PUT ${API_BASE}/maintenance/${maintId}/catat \\
    -H "Authorization: Bearer ${tek2Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"catatan_hasil": "Catat liar", "status": "Selesai"}'`;
  const outA5d = execSync(curlA5d).toString();
  console.log(outA5d);

  // Clean up test maintenance
  await pool.query('DELETE FROM maintenances WHERE id = $1', [maintId]);
  await pool.query('UPDATE perangkats SET status = $1 WHERE id = 1', ['Bagus']);

  // ====================================================================
  // TEST A.6: Teknisi membuka kembali Selesai ke Diproses = 422; Admin = boleh (200)
  // ====================================================================
  console.log('\n=== TEST A.6: Reopen Selesai ke Diproses (Teknisi 422 vs Admin 200) ===');
  console.log('--- 6a. Teknisi 2 mencoba membuka Komplain 3 (Selesai -> Diproses: Harus 422) ---');
  const curlA6a = `curl -s -i -X PUT ${API_BASE}/pengaduan/3/status \\
    -H "Authorization: Bearer ${tek2Token}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"status": "Diproses"}'`;
  const outA6a = execSync(curlA6a).toString();
  console.log(outA6a);

  console.log('--- 6b. Admin membuka Komplain 3 (Selesai -> Diproses: Boleh, 200 OK) ---');
  const curlA6b = `curl -s -i -X PUT ${API_BASE}/pengaduan/3/status \\
    -H "Authorization: Bearer ${adminToken}" \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"status": "Diproses", "catatan_teknisi": "Dibuka kembali oleh Admin"}'`;
  const outA6b = execSync(curlA6b).toString();
  console.log(outA6b);

  // Kembalikan ke Selesai oleh Admin agar DB tetap sama seperti semula
  await pool.query(`UPDATE pengaduans SET status = 'Selesai', updated_at = NOW() WHERE id = 3`);
  await pool.query(`UPDATE perangkats SET status = 'Bagus', updated_at = NOW() WHERE id = 9`);
  console.log('  [Cleanup] Komplain 3 dan Perangkat 9 dikembalikan ke status Selesai / Bagus.');

  // ====================================================================
  // TEST A.7: Rate Limiting (5 Percobaan gagal -> 429, jeda/reset -> 200)
  // ====================================================================
  console.log('\n=== TEST A.7: Rate Limiting Login (5 Gagal -> 429, Jeda -> 200) ===');
  const testEmail = `ratetest_${Date.now()}@campuscare.com`;
  for (let i = 1; i <= 5; i++) {
    execSync(`curl -s -X POST ${API_BASE}/login -H "Content-Type: application/json" -d '{"email":"${testEmail}","password":"wrong"}'`);
  }
  console.log('--- 7a. Percobaan ke-6 (Harus 429 Too Many Requests) ---');
  const curlA7a = `curl -s -i -X POST ${API_BASE}/login \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"email":"${testEmail}","password":"wrong"}'`;
  const outA7a = execSync(curlA7a).toString();
  console.log(outA7a);

  console.log('--- 7b. Reset / Berakhir Jeda, Login Akun Benar (Harus 200 OK) ---');
  // Clear the rate limit attempt for the IP or test with valid user
  await pool.query('DELETE FROM login_attempts WHERE key LIKE $1', [`%${testEmail}%`]);
  const curlA7b = `curl -s -i -X POST ${API_BASE}/login \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"email":"user1@campuscare.com","password":"password123"}'`;
  const outA7b = execSync(curlA7b).toString();
  console.log(outA7b);
  const matchA7b = outA7b.match(/"access_token":"(\d+)\|/);
  if (matchA7b) createdTokenIds.push(matchA7b[1]);

  // ====================================================================
  // TEST A.8: 5 POST /api/pengaduan Simultan (Hanya 1 tersimpan)
  // ====================================================================
  console.log('\n=== TEST A.8: 5 POST /api/pengaduan Simultan (Hanya 1 tersimpan) ===');
  const promises = [];
  const payload = JSON.stringify({
    perangkat_id: 1,
    deskripsi: 'Simultaneous Concurrent Test'
  });

  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${API_BASE}/pengaduan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user1Token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: payload
      }).then(async res => ({
        status: res.status,
        body: await res.json()
      }))
    );
  }

  const results = await Promise.all(promises);
  console.log('Hasil 5 Request Simultan:');
  let createdId = null;
  results.forEach((r, idx) => {
    console.log(`  Req #${idx + 1}: Status = ${r.status}, Message = ${r.body.message}`);
    if (r.status === 201 && r.body?.data?.id) {
      createdId = r.body.data.id;
    }
  });

  const successCount = results.filter(r => r.status === 201).length;
  const duplicateCount = results.filter(r => r.status === 422).length;
  console.log(`\nRingkasan Simultan: Success (201) = ${successCount}, Rejected (422) = ${duplicateCount}`);

  // Cleanup created test complaint
  if (createdId) {
    await pool.query('DELETE FROM pengaduans WHERE id = $1', [createdId]);
    await pool.query('UPDATE perangkats SET status = $1 WHERE id = 1', ['Bagus']);
    console.log(`  [Cleanup] Pengaduan uji #${createdId} berhasil dibersihkan, status perangkat kembali Bagus.`);
  }

  // ====================================================================
  // TEST B.5: Validasi format email salah
  // ====================================================================
  console.log('\n=== TEST B.5: Validasi format email salah ===');
  const curlB5 = `curl -s -i -X POST ${API_BASE}/login \\
    -H "Content-Type: application/json" \\
    -H "Accept: application/json" \\
    -d '{"email":"bukan-email-valid","password":"password123"}'`;
  const outB5 = execSync(curlB5).toString();
  console.log(outB5);

  // Global test tokens and attempts cleanup
  if (createdTokenIds.length > 0) {
    await pool.query('DELETE FROM personal_access_tokens WHERE id = ANY($1)', [createdTokenIds]);
    console.log(`  [Cleanup] ${createdTokenIds.length} token uji sesi berhasil dibersihkan.`);
  }
  await pool.query("DELETE FROM login_attempts WHERE key LIKE '%ratetest%'");

  console.log('\n================================================================');
  console.log('                     ALL TESTS COMPLETED                        ');
  console.log('================================================================');

  await pool.end();
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
