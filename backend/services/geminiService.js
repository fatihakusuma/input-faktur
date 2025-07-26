const model = require('../config/geminiConfig');

const extractInvoiceData = async (fileData, supplierOptions) => {
  const prompt = `
    Ekstrak data dari faktur pembelian farmasi. Format output JSON:
    {
      "supplier": "Nama Supplier (pilih dari: ${supplierOptions.join(', ')})",
      "no_faktur": "4 digit terakhir nomor faktur",
      "tanggal_faktur": "YYYY-MM-DD",
      "jenis_faktur": "Harga Belum Termasuk Pajak / Harga Sudah Termasuk Pajak / Tidak Termasuk Pajak",
      "jenis_pembayaran": "Tunai / Kredit",
      "tempo_pembayaran": "Jumlah hari (jika kredit, else null)",
      "produk": [
        {
          "nama": "Nama produk",
          "kuantitas": "angka",
          "satuan": "Satuan (pilih dari: Tablet, Strip, Botol, Kapsul, Tube, Pcs, dll)",
          "harga_beli": "angka tanpa titik",
          "diskon": "persentase (angka tanpa %), default 0",
          "expired_date": "YYYY-MM-DD",
          "no_batch": "kode batch"
        }
      ]
    }
    
    Peraturan khusus:
    1. Jika tidak ada tempo, jenis pembayaran = Tunai
    2. Pajak selalu 11%
    3. Diskoniai jika ada format "DI X%" di nama produk
    4. Untuk satuan, gunakan singkatan standar farmasi
  `;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: fileData.data, mimeType: fileData.type } }
  ]);

  const response = result.response;
  const text = response.text();

  // Parse JSON dari teks (mungkin perlu penanganan khusus)
  try {
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}') + 1;
    const jsonString = text.substring(startIndex, endIndex);
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Gagal parsing respons Gemini: ' + e.message);
  }
};

module.exports = { extractInvoiceData };