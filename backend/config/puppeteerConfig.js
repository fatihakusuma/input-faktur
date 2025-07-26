const puppeteer = require('puppeteer');
const config = require('../config/puppeteerConfig');
const { APOTEK_USER, APOTEK_PASS } = process.env;

const submitToApotekDigital = async (invoiceData, pharmacyUrl) => {
  let browser;
  try {
    browser = await puppeteer.launch(config);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Login ke sistem
    await loginToApotek(page, pharmacyUrl);

    // Navigasi ke halaman faktur pembelian
    await navigateToPurchaseInvoice(page, pharmacyUrl);

    // Isi form faktur
    await fillInvoiceForm(page, invoiceData);

    // Tambahkan produk
    for (const product of invoiceData.produk) {
      await addProduct(page, product);
    }

    // Simpan faktur
    await saveInvoice(page);

    return { success: true, message: 'Faktur berhasil diinput' };
  } catch (error) {
    console.error('Error during automation:', error);
    throw new Error('Automasi gagal: ' + error.message);
  } finally {
    if (browser) await browser.close();
  }
};

async function loginToApotek(page, pharmacyUrl) {
  const loginUrl = pharmacyUrl.replace('purchase-invoice', 'login');
  await page.goto(loginUrl, { waitUntil: 'networkidle2' });
  
  await page.type('input[name="email"]', APOTEK_USER);
  await page.type('input[name="password"]', APOTEK_PASS);
  
  const loginButton = await page.$('button[type="submit"]');
  await loginButton.click();
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000); // Tunggu loading selesai
}

async function navigateToPurchaseInvoice(page, pharmacyUrl) {
  await page.goto(pharmacyUrl, { waitUntil: 'networkidle2' });
  
  // Klik tombol tambah faktur
  const addButton = await page.$('button#add-purchase-invoice');
  if (!addButton) throw new Error('Tombol tambah faktur tidak ditemukan');
  
  await addButton.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.waitForTimeout(1000);
}

async function fillInvoiceForm(page, invoiceData) {
  // Pilih supplier
  await page.select('select#supplier', invoiceData.supplier);
  
  // Isi nomor faktur (4 digit terakhir)
  await page.type('input#no_faktur', invoiceData.no_faktur);
  
  // Jenis faktur
  const invoiceTypeMap = {
    'Harga Belum Termasuk Pajak': 'exclude_tax',
    'Harga Sudah Termasuk Pajak': 'include_tax',
    'Tidak Termasuk Pajak': 'non_tax'
  };
  await page.select('select#jenis_faktur', invoiceTypeMap[invoiceData.jenis_faktur]);
  
  // Jenis pembayaran
  if (invoiceData.jenis_pembayaran === 'Tunai') {
    await page.click('input[value="cash"][name="payment_type"]');
    // Kolom akun kas otomatis terisi
  } else {
    await page.click('input[value="credit"][name="payment_type"]');
    await page.type('input#tempo_pembayaran', invoiceData.tempo_pembayaran.toString());
    
    // Otomatis hitung tanggal jatuh tempo
    await page.evaluate(() => {
      const dueDays = parseInt(document.getElementById('tempo_pembayaran').value);
      if (!isNaN(dueDays)) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDays);
        document.getElementById('jatuh_tempo').value = dueDate.toISOString().split('T')[0];
      }
    });
  }
  
  // Tanggal penerimaan (otomatis diisi dengan waktu sekarang)
  const now = new Date();
  const formattedDate = now.toISOString().split('T')[0];
  const formattedTime = now.toTimeString().split(' ')[0];
  await page.type('input#tanggal_penerimaan', `${formattedDate} ${formattedTime}`);
}

async function addProduct(page, product) {
  // Klik tombol tambah produk
  await page.click('button#add-product');
  await page.waitForTimeout(500);
  
  // Dapatkan index produk terakhir
  const productIndex = (await page.$$('.product-row')).length - 1;
  
  // Isi data produk
  await page.type(`input[name="products[${productIndex}][name]"]`, product.nama);
  await page.type(`input[name="products[${productIndex}][quantity]"]`, product.kuantitas.toString());
  await page.select(`select[name="products[${productIndex}][unit]"]`, product.satuan);
  await page.type(`input[name="products[${productIndex}][price]"]`, product.harga_beli.toString());
  await page.type(`input[name="products[${productIndex}][discount]"]`, product.diskon.toString());
  await page.type(`input[name="products[${productIndex}][expired_date]"]`, product.expired_date);
  await page.type(`input[name="products[${productIndex}][batch]"]`, product.no_batch || '-');
  
  // Hitung pajak (11%)
  await page.evaluate((index) => {
    const price = parseFloat(document.querySelector(`input[name="products[${index}][price]"]`).value) || 0;
    const quantity = parseInt(document.querySelector(`input[name="products[${index}][quantity]"]`).value) || 0;
    const discount = parseFloat(document.querySelector(`input[name="products[${index}][discount]"]`).value) || 0;
    
    const subtotal = price * quantity * (1 - discount / 100);
    const tax = subtotal * 0.11;
    const total = subtotal + tax;
    
    document.querySelector(`input[name="products[${index}][tax]"]`).value = tax.toFixed(2);
    document.querySelector(`input[name="products[${index}][total]"]`).value = total.toFixed(2);
  }, productIndex);
}

async function saveInvoice(page) {
  // Klik tombol simpan
  const saveButton = await page.$('button#save-invoice');
  await saveButton.click();
  
  // Tunggu konfirmasi sukses
  await page.waitForSelector('.alert-success', { timeout: 10000 });
  await page.waitForTimeout(2000);
}

module.exports = { submitToApotekDigital };