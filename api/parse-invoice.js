import { createServer } from 'http';
import express from 'express';
import multer from 'multer';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
const upload = multer();
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.GEMINI_API_KEY,
}));

app.post('/api/parse-invoice', upload.single('file'), async (req, res) => {
  // ...analog to Python version, but using openai.chat.completions
});

app.post('/api/run', express.json(), async (req, res) => {
  const { target, faktur } = req.body;
  const endpoints = {
    azpyg: 'https://azpyg.apotekdigital.id/purchase-invoice',
    admv1: 'https://admv1.apotekdigital.id/purchase-invoice'
  };
  const r = await fetch(endpoints[target], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faktur)
  });
  if (!r.ok) return res.status(500).json({ error: await r.text() });
  res.json({ status: 'success' });
});

const server = createServer(app);
server.listen(process.env.PORT || 3000);
