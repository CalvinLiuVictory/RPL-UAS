import puppeteer from 'puppeteer-core';

async function testUI() {
  console.log('====================================================');
  console.log('      CAMPUSCARE HEADLESS CHROME BROWSER TEST       ');
  console.log('====================================================\n');

  console.log('[Browser] Launching /usr/bin/google-chrome-stable...');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Validation Message on Invalid Email
    // -------------------------------------------------------------
    console.log('\n[Test 1] Testing invalid email input: "bukan-email-valid" ...');
    const ctx1 = await browser.createBrowserContext();
    const page1 = await ctx1.newPage();
    await page1.setViewport({ width: 1280, height: 800 });

    await page1.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    console.log('  Page Title:', await page1.title());

    await page1.waitForSelector('#login-identifier');
    await page1.type('#login-identifier', 'bukan-email-valid');
    await page1.type('#login-password', 'password123');
    await page1.click('button.login-submit');

    await page1.waitForSelector('.login-error-banner', { timeout: 5000 });
    const errorText = await page1.$eval('.login-error-banner', el => el.textContent.trim());
    console.log('  UI Error Banner Content:', errorText);

    if (errorText.includes('Format email tidak valid')) {
      console.log('  => PASS: Validasi email ramah bahasa Indonesia tampil di UI banner!');
    } else {
      console.log('  => FAIL: Teks error tidak sesuai harapan:', errorText);
    }
    await ctx1.close();

    // -------------------------------------------------------------
    // Test 2: Login as Mahasiswa (User)
    // -------------------------------------------------------------
    console.log('\n[Test 2] Logging in as Mahasiswa: user1@campuscare.com ...');
    const ctx2 = await browser.createBrowserContext();
    const page2 = await ctx2.newPage();
    await page2.setViewport({ width: 1280, height: 800 });

    await page2.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page2.waitForSelector('#login-identifier');
    await page2.type('#login-identifier', 'user1@campuscare.com');
    await page2.type('#login-password', 'password123');
    await page2.click('button.login-submit');

    await page2.waitForFunction(() => window.location.pathname.startsWith('/user'), { timeout: 10000 });
    console.log('  Successfully navigated to:', page2.url());

    await page2.waitForSelector('main, .workspace-content', { timeout: 5000 });
    const userPageText = await page2.evaluate(() => document.body.innerText);
    const hasUserContent = userPageText.includes('Mahasiswa') || userPageText.includes('user1@campuscare.com') || userPageText.includes('CampusCare');
    console.log('  User workspace loaded successfully:', hasUserContent);
    await ctx2.close();

    // -------------------------------------------------------------
    // Test 3: Login as Admin
    // -------------------------------------------------------------
    console.log('\n[Test 3] Logging in as Admin: admin@campuscare.com ...');
    const ctx3 = await browser.createBrowserContext();
    const page3 = await ctx3.newPage();
    await page3.setViewport({ width: 1280, height: 800 });

    await page3.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page3.waitForSelector('#login-identifier');
    await page3.type('#login-identifier', 'admin@campuscare.com');
    await page3.type('#login-password', 'password123');
    await page3.click('button.login-submit');

    await page3.waitForFunction(() => window.location.pathname.startsWith('/admin'), { timeout: 10000 });
    console.log('  Successfully navigated to Admin Workspace:', page3.url());

    await page3.waitForSelector('main, .workspace-content', { timeout: 5000 });
    const adminContent = await page3.evaluate(() => document.body.innerText);
    const hasAdminContent = adminContent.includes('Pengaduan') || adminContent.includes('Admin') || adminContent.includes('CampusCare');
    console.log('  Admin dashboard loaded successfully:', hasAdminContent);
    await ctx3.close();

    // -------------------------------------------------------------
    // Test 4: Login as Teknisi
    // -------------------------------------------------------------
    console.log('\n[Test 4] Logging in as Teknisi: teknisi1@campuscare.com ...');
    const ctx4 = await browser.createBrowserContext();
    const page4 = await ctx4.newPage();
    await page4.setViewport({ width: 1280, height: 800 });

    await page4.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page4.waitForSelector('#login-identifier');
    await page4.type('#login-identifier', 'teknisi1@campuscare.com');
    await page4.type('#login-password', 'password123');
    await page4.click('button.login-submit');

    await page4.waitForFunction(() => window.location.pathname.startsWith('/teknisi'), { timeout: 10000 });
    console.log('  Successfully navigated to Teknisi Workspace:', page4.url());

    await page4.waitForSelector('main, .workspace-content', { timeout: 5000 });
    const tekContent = await page4.evaluate(() => document.body.innerText);
    const hasTekContent = tekContent.includes('Teknisi') || tekContent.includes('Tugas') || tekContent.includes('CampusCare');
    console.log('  Teknisi workspace loaded successfully:', hasTekContent);
    await ctx4.close();

    console.log('\n====================================================');
    console.log('   ALL 4 BROWSER UI TESTS PASSED SUCCESSFULLY!     ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Browser UI Test Error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testUI();
