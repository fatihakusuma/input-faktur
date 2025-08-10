require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Tambahkan modul path
const { GoogleGenerativeAI } = require("@google/generative-ai");
const puppeteer = require('puppeteer-core');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

// Validasi environment variables penting
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not defined");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi CORS dinamis
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://input-faktur.vercel.app']
  : ['http://localhost:3000', 'https://input-faktur.vercel.app'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// =============================================
// PERBAIKAN: Tambahkan static file serving
// =============================================
const frontendPath = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendPath));

// Handle semua route frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Endpoint root (sekarang sudah ditangani oleh static di atas)
// Endpoint proses invoice
app.post('/api/process-invoice', async (req, res) => { // Ubah path menjadi /api/process-invoice
  const { url } = req.body;

  // Validasi URL
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url); // Validasi format URL
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let browser;
  try {
    // Konfigurasi browser untuk Vercel
    const browserConfig = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      headless: 'new',
      timeout: 30000
    };

    // Gunakan executable khusus jika ada di environment
    if (process.env.CHROME_EXECUTABLE_PATH) {
      browserConfig.executablePath = process.env.CHROME_EXECUTABLE_PATH;
    }

    browser = await puppeteerExtra.launch(browserConfig);
    const page = await browser.newPage();
    
    // Navigasi dengan timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Tunggu body tersedia
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Ekstraksi konten
    const pageContent = await page.evaluate(() => {
      return document.body.innerText || '';
    });

    // Proses dengan Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Prompt yang lebih robust
    const prompt = `Extract invoice details from the following text and return in JSON format with these keys: 
      "vendor_name", "invoice_date" (YYYY-MM-DD format), "invoice_number", "total_amount" (number), "currency" (3-letter code). 
      If any information is missing, use null. Only return valid JSON.
      Text: ${pageContent.substring(0, 30000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Handle non-JSON response
    if (!text.startsWith('{') || !text.endsWith('}')) {
      throw new Error('Invalid response from Gemini API: ' + text);
    }

    const invoiceData = JSON.parse(text);
    res.json(invoiceData);
    
  } catch (error) {
    console.error('Error processing invoice:', error);
    
    // Response error lebih informatif
    const errorMessage = error.response 
      ? `Service error: ${error.response.status}`
      : error.message || 'Internal server error';
    
    res.status(500).json({ 
      error: 'Invoice processing failed',
      details: errorMessage
    });
    
  } finally {
    // Pastikan browser selalu ditutup
    if (browser) await browser.close();
  }
});

// Ekspor untuk Vercel
module.exports = app;

// Jalankan server lokal jika tidak di production
if (require.main === module && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
    console.log(`CORS allowed for: ${allowedOrigins.join(', ')}`);
    console.log(`Serving frontend from: ${frontendPath}`);
  });
}