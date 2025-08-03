const puppeteer = require('puppeteer-core');

async function submitToApotekDigital(invoiceData) {
  // 1. Dapatkan kredensial berdasarkan apotek tujuan
  const getCredentials = (pharmacy) => {
    switch(pharmacy) {
      case 'Azzahra':
        return {
          user: process.env.APOTEK_USER_AZZAHRA,
          pass: process.env.APOTEK_PASS_AZZAHRA
        };
      case 'Adameva':
        return {
          user: process.env.APOTEK_USER_ADAMEVA,
          pass: process.env.APOTEK_PASS_ADAMEVA
        };
      default:
        return {
          user: process.env.APOTEK_USER,
          pass: process.env.APOTEK_PASS
        };
    }
  };

  const { user, pass } = getCredentials(invoiceData.selectedPharmacy?.name);
  
  // 2. Connect to Browserless
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`,
    defaultViewport: { width: 1280, height: 720 }
  });

  try {
    const page = await browser.newPage();
    
    // 3. Set timeout lebih panjang
    await page.setDefaultNavigationTimeout(60000); // 60 detik
    
    // 4. Navigasi ke halaman login
    await page.goto('https://apotekdigital.com/login', { waitUntil: 'networkidle2' });
    
    // 5. Isi form login
    await page.type('#username', user);
    await page.type('#password', pass);
    
    // 6. Submit form
    await Promise.all([
      page.waitForNavigation(),
      page.click('#login-button')
    ]);
    
    // 7. Navigasi ke halaman input faktur
    await page.goto('https://apotekdigital.com/input-faktur', { waitUntil: 'domcontentloaded' });
    
    // 8. Input data faktur
    await page.type('#supplier', invoiceData.supplier);
    await page.type('#tanggal', invoiceData.tanggal);
    
    // 9. Input produk
    for (const [index, produk] of invoiceData.produk.entries()) {
      await page.click('#add-product');
      
      await page.type(`#produk-${index}-nama`, produk.nama);
      await page.type(`#produk-${index}-harga`, produk.harga_beli.toString());
      await page.type(`#produk-${index}-quantity`, produk.quantity.toString());
      await page.select(`#produk-${index}-satuan`, produk.satuan);
    }
    
    // 10. Submit form
    await Promise.all([
      page.waitForNavigation(),
      page.click('#submit-faktur')
    ]);
    
    console.log('Data berhasil diinput ke Apotek Digital');
  } catch (error) {
    console.error('Error during automation:', error);
    
    // Capture screenshot for debugging
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    console.log('Screenshot saved to /tmp/error-screenshot.png');
    
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { submitToApotekDigital };
