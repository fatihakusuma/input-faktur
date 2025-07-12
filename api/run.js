// api/run.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { target, ...data } = req.body;
  const endpoints = {
    azpyg: 'https://azpyg.apotekdigital.id/purchase-invoice',
    admv1: 'https://admv1.apotekdigital.id/purchase-invoice',
  };

  const url = endpoints[target];
  if (!url) {
    return res.status(400).json({ error: 'Invalid target' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Status ${response.status}: ${text}`);
    }

    return res.status(200).json({ status: 'success', target });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
