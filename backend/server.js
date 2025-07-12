// === BACKEND: server.js ===
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const dayjs = require('dayjs');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// Helper: Extract diskon if formatted as "DI 5%"
function extractDiskon(nama) {
  const match = nama.match(/\s+DI\s+(\d+)%/i);
  if (match) {
    const diskon = match[1];
    const namaProduk = nama.replace(/\s+DI\s+\d+%/i, '').trim();
    return { nama: namaProduk, diskon };
  }
  return { nama, diskon: "0" };
}

app.post('/parse-invoice', upload.single('file'), async (req, res) => {
  const file = req.file;
  const now = dayjs().format('YYYY-MM-DD');
  try {
    const dataBuffer = fs.readFileSync(file.path);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    const produkList = [];

    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes("tolak angin") || lower.includes("paracetamol")) {
        // Dummy parsing logic; customize as needed
        const nama = line.trim();
        const kuantitas = 10;
        const harga_beli = 5000;

        const { nama: cleanNama, diskon } = extractDiskon(nama);

        produkList.push({
          nama: cleanNama,
          kuantitas,
          harga_beli,
          expired: now,
          batch: '-',
          pajak: '11%',
          diskon
        });
      }
    }

    const jenis_faktur = /ppn/i.test(text) ? "Harga Sudah Termasuk Pajak" : "Tidak Termasuk Pajak";
    const jenis_pembayaran = /tempo/i.test(text) ? "Kredit" : "Tunai";

    const result = {
      supplier: "ENSEVAL PUTRA MEGATRADING (EPM)",
      no_faktur: (text.match(/\d{4,}/) || ["0000"])[0].slice(-4),
      tanggal_faktur: now,
      tanggal_penerimaan: dayjs().format('YYYY-MM-DDTHH:mm'),
      jenis_faktur,
      jenis_pembayaran,
      produk: produkList
    };

    fs.unlinkSync(file.path);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Gagal membaca file faktur', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
