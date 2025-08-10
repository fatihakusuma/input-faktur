import React, { useState } from 'react';

const InvoiceForm = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      console.log('Invoice data:', data);
      // Navigasi ke halaman hasil akan ditambahkan nanti
      alert(`Data faktur berhasil diproses: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat memproses faktur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invoice-form">
      <h1>Input Faktur Otomatis</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Masukkan URL faktur"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Proses Faktur'}
        </button>
      </form>
    </div>
  );
};

export default InvoiceForm;