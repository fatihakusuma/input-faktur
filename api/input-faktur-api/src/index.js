import { Router } from 'itty-router';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
let genAI;

// Utility: placeholder for PDF text extraction
async function extractTextFromPdf(file) {
  return '[[PDF text extraction not implemented]]';
}

// POST /parse-invoice -> extract data via Gemini AI
router.post('/parse-invoice', async (request) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!file) return new Response('No file uploaded', { status: 400 });

  const text = await extractTextFromPdf(file);
  const prompt = `
Ekstrak data faktur pembelian berikut:
- supplier
- no_faktur (4 digit terakhir)
- tanggal_faktur (YYYY-MM-DD)
- jenis_faktur (Harga Belum Termasuk Pajak / Harga Sudah Termasuk Pajak / Tidak Termasuk Pajak)
- jenis_pembayaran (Tunai jika tidak ada 'tempo', Kredit jika ada)
- produk: nama, kuantitas, harga_beli, expired (default hari ini), batch (default "-"), pajak (11%), diskon (jika ada 'DI xx%')
Teks faktur:
${text}
Format JSON:
{
  "supplier": "",
  "no_faktur": "",
  "tanggal_faktur": "",
  "jenis_faktur": "",
  "jenis_pembayaran": "",
  "produk": [
    {"nama":"","kuantitas":0,"harga_beli":0,"expired":"","batch":"","pajak":11,"diskon":0}
  ]
}
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const aiResult = await model.generateContent(prompt);
  const raw = (await aiResult.response).text();
  const jsonText = raw.slice(raw.indexOf('{'));

  let data;
  try { data = JSON.parse(jsonText); }
  catch { return new Response('Invalid JSON from Gemini', { status: 502 }); }

  const today = new Date().toISOString().split('T')[0];
  data.produk = data.produk.map(item => ({
    nama: item.nama,
    kuantitas: item.kuantitas || 1,
    harga_beli: item.harga_beli || 0,
    expired: item.expired || today,
    batch: item.batch || '-',
    pajak: 11,
    diskon: item.diskon || 0
  }));

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});

// POST /run -> forward to target endpoint
router.post('/run', async (request) => {
  let body;
  try { body = await request.json(); }
  catch { return new Response('Invalid JSON body', { status: 400 }); }

  const { target, ...invoice } = body;
  const endpoints = {
    azpyg: 'https://azpyg.apotekdigital.id/purchase-invoice',
    admv1: 'https://admv1.apotekdigital.id/purchase-invoice'
  };
  const url = endpoints[target];
  if (!url) return new Response('Invalid target', { status: 400 });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice)
  });

  const text = await resp.text();
  return new Response(text, { status: resp.status });
});

// Fallback 404
router.all('*', () => new Response('Not Found', { status: 404 }));

// Exported Worker handler with CORS support
export default {
  async fetch(request, env) {
    if (!genAI) genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const response = await router.handle(request);
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
};
