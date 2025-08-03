const fs = require('fs');
const path = require('path');
const { submitToApotekDigital } = require('../services/puppeteerService');
const { calculatePriceChanges } = require('../services/priceService');

// =================== PENYIMPANAN FILE (DISABLE DI VERCEL) ===================
const DISABLE_FILE_STORAGE = process.env.DISABLE_FILE_STORAGE === 'true' || process.env.NODE_ENV === 'production';

// Path untuk file penyimpanan
const DATA_DIR = DISABLE_FILE_STORAGE ? null : path.join(__dirname, '..', 'data');
const INVOICES_FILE = DISABLE_FILE_STORAGE ? null : path.join(DATA_DIR, 'invoices.json');
const PRICES_FILE = DISABLE_FILE_STORAGE ? null : path.join(DATA_DIR, 'prices.json');

let invoices = [];
let previousPrices = [];

// Inisialisasi hanya jika file storage diaktifkan
if (!DISABLE_FILE_STORAGE) {
  console.log('File storage enabled');
  
  // Buat folder data jika belum ada
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load data dari file
  try {
    if (fs.existsSync(INVOICES_FILE)) {
      invoices = JSON.parse(fs.readFileSync(INVOICES_FILE));
      console.log(`Loaded ${invoices.length} invoices from file`);
    }
    
    if (fs.existsSync(PRICES_FILE)) {
      previousPrices = JSON.parse(fs.readFileSync(PRICES_FILE));
      console.log(`Loaded ${previousPrices.length} previous prices from file`);
    }
  } catch (error) {
    console.error('Error loading data files:', error);
  }
} else {
  console.log('File storage disabled in production');
}

// Helper untuk mendapatkan harga sebelumnya
const getPreviousPrices = () => {
  return previousPrices;
};

// Simpan data ke file (hanya jika diaktifkan)
const saveDataToFile = () => {
  if (DISABLE_FILE_STORAGE) return;
  
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));
    fs.writeFileSync(PRICES_FILE, JSON.stringify(previousPrices, null, 2));
    console.log('Data saved to files');
  } catch (error) {
    console.error('Error saving data to files:', error);
  }
};

// Auto-save hanya jika diaktifkan
if (!DISABLE_FILE_STORAGE) {
  setInterval(saveDataToFile, 5 * 60 * 1000); // 5 menit
}
// ============================================================================

exports.submitInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Validasi data minimal
    if (!invoiceData.supplier || !invoiceData.tanggal || !invoiceData.produk || !Array.isArray(invoiceData.produk)) {
      return res.status(400).json({
        success: false,
        message: 'Data faktur tidak valid'
      });
    }
    
    // Tambahkan metadata
    const invoiceWithMeta = {
      ...invoiceData,
      id: Date.now().toString(), // ID unik berdasarkan timestamp
      createdAt: new Date().toISOString(),
      status: 'processed'
    };
    
    // Simpan di memori
    invoices.push(invoiceWithMeta);
    
    // Update harga sebelumnya dengan data terbaru
    invoiceData.produk.forEach(produk => {
      const existingIndex = previousPrices.findIndex(p => p.nama === produk.nama);
      if (existingIndex !== -1) {
        previousPrices[existingIndex].harga = produk.harga_beli;
        previousPrices[existingIndex].lastUpdated = new Date().toISOString();
      } else {
        previousPrices.push({
          nama: produk.nama,
          harga: produk.harga_beli,
          firstSeen: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
      }
    });
    
    // Batasi jumlah data yang disimpan (hanya 100 terbaru)
    if (invoices.length > 100) {
      invoices = invoices.slice(-100);
    }
    
    // Batasi jumlah harga sebelumnya (200 item)
    if (previousPrices.length > 200) {
      // Simpan hanya yang paling sering diupdate
      previousPrices = previousPrices
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 200);
    }
    
    // Simpan ke file (jika diaktifkan)
    saveDataToFile();
    
    // Simulasikan submit ke Apotek Digital jika diperlukan
    if (process.env.ENABLE_APOTEK_DIGITAL === 'true') {
      try {
        await submitToApotekDigital(invoiceData);
      } catch (puppeteerError) {
        console.warn('Puppeteer submission failed:', puppeteerError);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Data berhasil diproses dan disimpan',
      invoiceId: invoiceWithMeta.id
    });
  } catch (error) {
    console.error('Error processing invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses data',
      error: error.message
    });
  }
};

exports.comparePrices = async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: 'Data produk tidak valid'
      });
    }
    
    // Dapatkan harga sebelumnya
    const prevPrices = getPreviousPrices();
    
    // Hitung perubahan harga
    const priceChanges = calculatePriceChanges(products, prevPrices);
    
    res.json({
      success: true,
      data: priceChanges
    });
  } catch (error) {
    console.error('Error comparing prices:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membandingkan harga',
      error: error.message
    });
  }
};

// Fungsi tambahan untuk mendapatkan data invoice
exports.getInvoice = (req, res) => {
  try {
    const { id } = req.params;
    const invoice = invoices.find(inv => inv.id === id);
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data invoice'
    });
  }
};

// Fungsi untuk mendapatkan semua invoice (hanya untuk debugging)
exports.getAllInvoices = (req, res) => {
  res.json({
    success: true,
    count: invoices.length,
    data: invoices
  });
};

// Fungsi untuk mendapatkan harga sebelumnya
exports.getPreviousPrices = (req, res) => {
  res.json({
    success: true,
    data: previousPrices
  });
};

// Fungsi untuk reset data (hanya untuk development)
exports.resetData = (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    invoices = [];
    previousPrices = [];
    
    // Hapus file data (jika diaktifkan)
    if (!DISABLE_FILE_STORAGE) {
      try {
        if (fs.existsSync(INVOICES_FILE)) fs.unlinkSync(INVOICES_FILE);
        if (fs.existsSync(PRICES_FILE)) fs.unlinkSync(PRICES_FILE);
      } catch (error) {
        console.error('Error deleting data files:', error);
      }
    }
    
    res.json({ success: true, message: 'Data telah direset' });
  } else {
    res.status(403).json({ success: false, message: 'Tidak diizinkan di production' });
  }
};

// Simpan data saat proses exit (hanya jika diaktifkan)
if (!DISABLE_FILE_STORAGE) {
  process.on('SIGINT', () => {
    console.log('Saving data before exit...');
    saveDataToFile();
    process.exit();
  });

  process.on('SIGTERM', () => {
    console.log('Saving data before exit...');
    saveDataToFile();
    process.exit();
  });
}
