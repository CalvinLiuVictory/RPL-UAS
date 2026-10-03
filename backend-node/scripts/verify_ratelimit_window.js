async function testRateLimitWindow() {
  const API_BASE = 'http://localhost:8000/api';
  console.log('=== VERIFIKASI RATE LIMIT: 429 -> TUNGGU JENDELA HABIS -> LOGIN BERHASIL ===\n');

  const testEmail = `ratetest_window_${Date.now()}@campuscare.com`;

  // 1. Send 5 failed attempts
  console.log(`[Step 1] Mengirim 5 percobaan gagal berturut-turut untuk: ${testEmail}...`);
  for (let i = 1; i <= 5; i++) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'wrong' })
    });
    console.log(`  Percobaan #${i}: Status = ${res.status}`);
  }

  // 2. 6th attempt must return 429
  console.log('\n[Step 2] Percobaan ke-6 (Harus menghasilkan 429 Too Many Requests):');
  const res6 = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'wrong' })
  });
  const body6 = await res6.json();
  const retryAfter = res6.headers.get('Retry-After');
  console.log(`  Status = ${res6.status} ${res6.statusText}`);
  console.log(`  Header Retry-After = ${retryAfter} detik`);
  console.log(`  Body =`, body6);

  if (res6.status !== 429) {
    console.error('FAIL: Status bukan 429!');
    process.exit(1);
  }

  // 3. Wait for the window to expire
  const waitSeconds = parseInt(retryAfter || '60', 10) + 2;
  console.log(`\n[Step 3] Menunggu selama ${waitSeconds} detik sampai jendela waktu kedaluwarsa (TANPA reset manual database)...`);
  await new Promise(r => setTimeout(r, waitSeconds * 1000));
  console.log('  Jeda waktu selesai.');

  // 4. Send correct login for valid account
  console.log('\n[Step 4] Mencoba login dengan kredensial benar setelah jeda:');
  const resValid = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user1@campuscare.com', password: 'password123' })
  });
  const bodyValid = await resValid.json();
  console.log(`  Status = ${resValid.status} ${resValid.statusText}`);
  console.log(`  User = ${bodyValid.user?.name} (${bodyValid.user?.role})`);
  console.log(`  Token = ${bodyValid.access_token ? bodyValid.access_token.slice(0, 8) + '...' : 'none'}`);

  if (resValid.status === 200 && bodyValid.access_token) {
    console.log('\n=> PASS: Rate limit berhasil pulih secara otomatis setelah jeda waktu habis tanpa intervensi manual!');
  } else {
    console.error('\n=> FAIL: Login belum berhasil setelah jeda.');
    process.exit(1);
  }
}

testRateLimitWindow();
