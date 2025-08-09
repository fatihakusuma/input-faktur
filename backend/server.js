require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const puppeteer = require('puppeteer-core');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint untuk verifikasi server hidup
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Invoice processing API is running",
    endpoints: {
      process: "/process-invoice (POST)"
    }
  });
});

// Endpoint untuk memproses invoice
app.post('/process-invoice', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Konfigurasi khusus untuk Vercel
    const browser = await puppeteerExtra.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      executablePath: process.env.CHROME_EXECUTABLE_PATH || null,
      headless: 'new'
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Ekstraksi teks dari halaman
    const pageContent = await page.evaluate(() => {
      return document.body.innerText;
    });

    await browser.close();

    // Proses dengan Google Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Extract the following invoice details in JSON format with keys: "vendor_name", "invoice_date", "invoice_number", "total_amount", "currency". Only respond with the JSON object. Here is the text: ${pageContent.substring(0, 15000)}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Parsing respons JSON
    try {
      const invoiceData = JSON.parse(text);
      res.json(invoiceData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).json({ error: 'Failed to parse invoice data', details: text });
    }
  } catch (error) {
    console.error('Error processing invoice:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Ekspor app untuk Vercel
module.exports = app;

// Jika dijalankan secara lokal, jalankan server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
