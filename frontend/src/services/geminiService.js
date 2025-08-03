import axiosInstance from '../api/axiosConfig';

export const analyzeInvoice = async (invoiceData) => {
  try {
    const response = await axiosInstance.post('/analyze', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error analyzing invoice:', error);
    throw error;
  }
};
// Simulasi pemrosesan Gemini AI
export const processInvoice = async (fileData) => {
  // Simulasi delay pemrosesan
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Data contoh dari faktur
  return {
    supplier: "VICTORY",
    no_faktur: "3456",
    tanggal_faktur: "2025-07-26",
    jenis_faktur: "Harga Belum Termasuk Pajak",
    jenis_pembayaran: "Kredit",
    tempo_pembayaran: 30,
    produk: [
      {
        nama: "Paracetamol 500mg",
        kuantitas: 100,
        satuan: "Strip",
        harga_beli: 15000,
        diskon: 5,
        expired_date: "2026-07-26",
        no_batch: "B12345"
      },
      {
        nama: "Amoxicillin 500mg",
        kuantitas: 50,
        satuan: "Tablet",
        harga_beli: 2500,
        diskon: 0,
        expired_date: "2025-12-31",
        no_batch: "C67890"
      }
    ]
  };
};
