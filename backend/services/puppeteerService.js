const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getPharmacyCredentials } = require('../utils/authHelpers');
const config = require('../config/puppeteerConfig');

puppeteer.use(StealthPlugin());

const submitToApotekDigital = async (invoiceData, pharmacyUrl) => {
  let browser;
  try {
    browser = await puppeteer.launch(config);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setDefaultNavigationTimeout(60000);

    // Dapatkan kredensial berdasarkan URL apotek
    const credentials = getPharmacyCredentials(pharmacyUrl);

    // Login ke sistem
    await loginToApotek(page, pharmacyUrl, credentials);

    // ... (sisa kode tidak berubah)
  } catch (error) {
    console.error('Error during automation:', error);
    throw new Error('Automasi gagal: ' + error.message);
  } finally {
    if (browser) await browser.close();
  }
};

async function loginToApotek(page, pharmacyUrl, credentials) {
  const baseUrl = new URL(pharmacyUrl).origin;
  const loginUrl = `${baseUrl}/login`;
  
  await page.goto(loginUrl, { waitUntil: 'networkidle2' });
  
  // Tunggu form login muncul
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  
  await page.type('input[name="email"]', credentials.user);
  await page.type('input[name="password"]', credentials.pass);
  
  // Submit form login
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  
  // Verifikasi login berhasil
  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    throw new Error('Login gagal, cek kredensial');
  }
  
  await page.waitForTimeout(2000); // Tunggu loading selesai
}

// ... (fungsi lainnya tetap sama)