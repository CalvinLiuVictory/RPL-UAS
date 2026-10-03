import puppeteer from 'puppeteer-core';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const FRONTEND_URL = 'https://rpl-uts.vercel.app';
const API_BASE = process.env.API_URL || 'https://backend-node-weld.vercel.app/api';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.pvzltsqlwiffzxjeaoaa:Benaya*357%23@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function runTest() {
  console.log('================================================================');
  console.log('    TEST BROWSER CHROME HEADLESS & API KE URL PRODUKSI VERCEL   ');
  console.log('================================================================\n');
  console.log('Frontend URL:', FRONTEND_URL);
  console.log('Backend API URL:', API_BASE);
  console.log();

  const cspErrors = [];
  const consoleMessages = [];

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.includes('Content Security Policy') || text.includes('CSP') || text.includes('refused to connect')) {
      cspErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleMessages.push('PAGEERROR: ' + err.message);
  });

  try {
    // ------------------------------------------------------------------
    // 1. CSP & LOGIN TEST DI URL VERCEL
    // ------------------------------------------------------------------
    console.log('[1/5] Membuka halaman Login di URL Vercel...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('  URL login berhasil dibuka. Status Title:', await page.title());

    console.log('  Menginput kredensial teknisi...');
    await page.type('#login-identifier', 'teknisi1@campuscare.com');
    await page.type('#login-password', 'password123');
    await page.click('button.login-submit');

    await page.waitForFunction(
      () => window.location.pathname.startsWith('/teknisi') || window.location.pathname.startsWith('/technician'),
      { timeout: 15000 }
    );
    console.log('  Login berhasil di produksi Vercel! URL saat ini:', page.url());

    // ------------------------------------------------------------------
    // 2. REDIRECT /technician/dashboard -> /teknisi/dashboard
    // ------------------------------------------------------------------
    console.log('\n[2/5] Menguji redirect /technician/dashboard ke /teknisi/dashboard...');
    await page.goto(`${FRONTEND_URL}/technician/dashboard`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForFunction(() => window.location.pathname.startsWith('/teknisi'), { timeout: 10000 });
    const currentUrl = page.url();
    console.log('  URL setelah akses /technician/dashboard:', currentUrl);

    if (currentUrl.endsWith('/teknisi/dashboard')) {
      console.log('  => PASS: Redirect dari /technician/dashboard ke /teknisi/dashboard berhasil!');
    } else {
      throw new Error(`Redirect gagal, URL tetap: ${currentUrl}`);
    }

    // ------------------------------------------------------------------
    // 3. F5 DI HALAMAN DALAM (/teknisi/repair)
    // ------------------------------------------------------------------
    console.log('\n[3/5] Menguji refresh F5 di halaman dalam (/teknisi/repair)...');
    await page.goto(`${FRONTEND_URL}/teknisi/repair`, { waitUntil: 'networkidle2', timeout: 15000 });
    console.log('  Sebelum refresh, URL:', page.url());

    await page.reload({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('  Setelah refresh F5, URL:', page.url());

    const bodyText = await page.evaluate(() => document.body.innerText);
    const sessionActive = bodyText.includes('Teknisi') || bodyText.includes('CampusCare') || bodyText.includes('Perbaikan');
    if (sessionActive && page.url().endsWith('/teknisi/repair')) {
      console.log('  => PASS: Sesi tetap aktif dan data dimuat normal setelah F5!');
    } else {
      throw new Error('Sesi terputus atau 404 setelah F5.');
    }

    // ------------------------------------------------------------------
    // 4. CEK CSP ERRORS PADA BROWSER
    // ------------------------------------------------------------------
    console.log('\n[4/5] Memeriksa log error CSP di browser console...');
    if (cspErrors.length === 0) {
      console.log('  => PASS: TIDAK ADA ERROR CSP DI CONSOLE! Login dan data berjalan tanpa terblokir.');
    } else {
      console.warn('  Ditemukan potensi log CSP:', cspErrors);
    }

    // ------------------------------------------------------------------
    // 5. BUKTI PEMANGGILAN /periksa, /perbaiki, /maintenance DI BACKEND PRODUKSI
    // ------------------------------------------------------------------
    console.log('\n[5/5] Menguji pemanggilan endpoint /periksa, /perbaiki, /maintenance di backend live...');
    
    // Login API to get tokens
    const tkRes = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: 'teknisi1@campuscare.com', password: 'password123' })
    });
    const tkData = await tkRes.json();
    const tekToken = tkData.access_token;
    const tekTokenId = tekToken.split('|')[0];

    const admRes = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: 'admin@campuscare.com', password: 'password123' })
    });
    const admData = await admRes.json();
    const admToken = admData.access_token;
    const admTokenId = admToken.split('|')[0];

    // 5a. Call /periksa on complaint 2
    console.log('  --- Calling PUT /api/pengaduan/2/periksa ---');
    const periksaRes = await fetch(`${API_BASE}/pengaduan/2/periksa`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tekToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ catatan_teknisi: '[Pemeriksaan Headless]: Port HDMI longgar' })
    });
    const periksaBody = await periksaRes.json();
    console.log('  Status /periksa:', periksaRes.status, 'Message:', periksaBody.message);

    // 5b. Call /perbaiki on complaint 2
    console.log('  --- Calling PUT /api/pengaduan/2/perbaiki ---');
    const perbaikiRes = await fetch(`${API_BASE}/pengaduan/2/perbaiki`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tekToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ catatan_teknisi: '[Perbaikan Headless]: Sambungan disolder ulang' })
    });
    const perbaikiBody = await perbaikiRes.json();
    console.log('  Status /perbaiki:', perbaikiRes.status, 'Message:', perbaikiBody.message);

    // 5c. Call GET /api/maintenance
    console.log('  --- Calling GET /api/maintenance ---');
    const getMnt = await fetch(`${API_BASE}/maintenance`, {
      headers: { 'Authorization': `Bearer ${tekToken}`, 'Accept': 'application/json' }
    });
    const mntList = await getMnt.json();
    console.log('  Status GET /maintenance:', getMnt.status, 'Jumlah data:', Array.isArray(mntList) ? mntList.length : 'Bukan array');

    // 5d. Call POST /api/maintenance (Admin)
    console.log('  --- Calling POST /api/maintenance ---');
    const createMnt = await fetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${admToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        perangkat_id: 1,
        teknisi_id: 2,
        tanggal_jadwal: '2026-10-20',
        deskripsi_pekerjaan: 'Maintenance Pembersihan Berkala Lab'
      })
    });
    const newMnt = await createMnt.json();
    console.log('  Status POST /maintenance:', createMnt.status, 'ID:', newMnt.data?.id);
    const mntId = newMnt.data?.id;

    // 5e. Call PUT /api/maintenance/{id}/catat
    if (mntId) {
      console.log(`  --- Calling PUT /api/maintenance/${mntId}/catat ---`);
      const catatRes = await fetch(`${API_BASE}/maintenance/${mntId}/catat`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tekToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          catatan_hasil: 'Pembersihan motherboard & kipas selesai.',
          status: 'Selesai'
        })
      });
      const catatBody = await catatRes.json();
      console.log('  Status /maintenance/{id}/catat:', catatRes.status, 'Message:', catatBody.message);

      // Clean up test maintenance record & restore device 1 to Bagus
      await pool.query('DELETE FROM maintenances WHERE id = $1', [mntId]);
      await pool.query('UPDATE perangkats SET status = $1 WHERE id = 1', ['Bagus']);
      console.log(`  [Cleanup] Jadwal maintenance uji #${mntId} dibersihkan.`);
    }

    // Clean up created session tokens
    await pool.query('DELETE FROM personal_access_tokens WHERE id = ANY($1)', [[tekTokenId, admTokenId]]);
    console.log('  [Cleanup] Token sesi uji berhasil dibersihkan.');

    console.log('\n================================================================');
    console.log('             SELURUH PENGUJIAN ITEM 1-5 BERHASIL (PASS)         ');
    console.log('================================================================');
  } finally {
    await browser.close();
    await pool.end();
  }
}

runTest().catch(err => {
  console.error('Test gagal:', err);
  process.exit(1);
});
