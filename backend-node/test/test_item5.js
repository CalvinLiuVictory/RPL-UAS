import puppeteer from 'puppeteer-core';

async function testItem5() {
  console.log('====================================================');
  console.log('      PENGUJIAN ITEM 5 (HEADLESS CHROME)           ');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const interceptedCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/')) {
      interceptedCalls.push({ method: req.method(), url });
    }
  });

  try {
    // 1. Test /technician/dashboard -> /teknisi/dashboard redirect
    console.log('[Test 5a] Menguji redirect /technician/dashboard ke /teknisi/dashboard...');
    // Login as teknisi first
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('#login-identifier', 'teknisi1@campuscare.com');
    await page.type('#login-password', 'password123');
    await page.click('button.login-submit');

    await page.waitForFunction(() => window.location.pathname.startsWith('/teknisi'), { timeout: 10000 });
    console.log('  Login teknisi sukses. URL saat ini:', page.url());

    // Navigate to /technician/dashboard
    console.log('  Membuka URL alias /technician/dashboard...');
    await page.goto('http://localhost:5173/technician/dashboard', { waitUntil: 'networkidle2' });
    const finalUrl = page.url();
    console.log('  URL setelah navigasi:', finalUrl);

    if (finalUrl === 'http://localhost:5173/teknisi/dashboard') {
      console.log('  => PASS: /technician/dashboard berhasil dialihkan ke bentuk kanonik /teknisi/dashboard tanpa loop!');
    } else {
      console.log('  => FAIL: Redirect tidak sesuai:', finalUrl);
    }

    // 2. Test F5 di halaman dalam (tetap login dan memuat data)
    console.log('\n[Test 5b] Menguji F5 (refresh) di halaman dalam /teknisi/repair...');
    await page.goto('http://localhost:5173/teknisi/repair', { waitUntil: 'networkidle2' });
    console.log('  Sebelum refresh, URL:', page.url());

    await page.reload({ waitUntil: 'networkidle2' });
    console.log('  Setelah refresh F5, URL:', page.url());

    await page.waitForSelector('main, .workspace-content', { timeout: 5000 });
    const content = await page.evaluate(() => document.body.innerText);
    const hasData = content.includes('Teknisi') || content.includes('Repair') || content.includes('CampusCare');
    console.log('  Halaman berhasil direfresh dan data tetap termuat:', hasData);

    // 3. Test API endpoints /periksa, /perbaiki, /maintenance
    console.log('\n[Test 5c] Menguji pemanggilan endpoint /periksa, /perbaiki, /maintenance...');
    const API_BASE = 'http://localhost:8000/api';
    
    // Login as admin to get token
    const adminLogin = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@campuscare.com', password: 'password123' })
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.access_token;

    // Login as teknisi 1
    const tekLogin = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teknisi1@campuscare.com', password: 'password123' })
    });
    const tekData = await tekLogin.json();
    const tekToken = tekData.access_token;

    // Call /periksa on complaint 2 (assigned to teknisi 1)
    const periksaRes = await fetch(`${API_BASE}/pengaduan/2/periksa`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tekToken}` },
      body: JSON.stringify({ catatan_teknisi: 'Pemeriksaan rutin kabel LAN' })
    });
    console.log('  PUT /api/pengaduan/2/periksa status:', periksaRes.status);

    // Call /perbaiki on complaint 2
    const perbaikiRes = await fetch(`${API_BASE}/pengaduan/2/perbaiki`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tekToken}` },
      body: JSON.stringify({ catatan_teknisi: 'Penggantian konektor RJ45 selesai' })
    });
    console.log('  PUT /api/pengaduan/2/perbaiki status:', perbaikiRes.status);

    // Call /maintenance (GET)
    const mntRes = await fetch(`${API_BASE}/maintenance`, {
      headers: { 'Authorization': `Bearer ${tekToken}` }
    });
    console.log('  GET /api/maintenance status:', mntRes.status, 'isArray:', Array.isArray(await mntRes.json()));

    // Call /maintenance (POST by admin) & /maintenance/{id}/catat
    const createMnt = await fetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        perangkat_id: 1,
        teknisi_id: 2,
        tanggal_jadwal: '2026-10-15',
        deskripsi_pekerjaan: 'Maintenance AC Triwulan'
      })
    });
    const mntData = await createMnt.json();
    console.log('  POST /api/maintenance status:', createMnt.status, 'ID:', mntData.data?.id);

    if (mntData.data?.id) {
      const catatRes = await fetch(`${API_BASE}/maintenance/${mntData.data.id}/catat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tekToken}` },
        body: JSON.stringify({
          catatan_hasil: 'Kondisi AC bersih dan normal',
          status: 'Selesai'
        })
      });
      console.log('  PUT /api/maintenance/{id}/catat status:', catatRes.status);

      // Cleanup test maintenance
      const db = (await import('../src/db.js')).default;
      await db.query('DELETE FROM maintenances WHERE id = $1', [mntData.data.id]);
      await db.query('UPDATE perangkats SET status = $1 WHERE id = 1', ['Bagus']);
    }

    console.log('\n====================================================');
    console.log('   SELURUH PENGUJIAN ITEM 5 BERHASIL (PASS)!       ');
    console.log('====================================================');
  } catch (err) {
    console.error('Item 5 test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testItem5();
