import React, { useState, useEffect } from 'react';
import { submitToApotekDigital } from '../services/apotekService';

const ResultPage = () => {
  const [status, setStatus] = useState('memproses');
  const [error, setError] = useState(null);

  useEffect(() => {
    const uploadData = async () => {
      try {
        const invoiceData = JSON.parse(localStorage.getItem('invoiceData'));
        const targetPharmacy = JSON.parse(localStorage.getItem('targetPharmacy'));
        
        if (!invoiceData || !targetPharmacy) {
          throw new Error('Data tidak ditemukan');
        }
        
        setStatus('mengupload ke Apotek Digital...');
        
        // Simulasi upload
        await submitToApotekDigital(invoiceData, targetPharmacy);
        
        setStatus('berhasil');
        
        // Hapus data setelah 5 detik
        setTimeout(() => {
          localStorage.removeItem('invoiceData');
          localStorage.removeItem('targetPharmacy');
        }, 5000);
      } catch (err) {
        setStatus('gagal');
        setError(err.message);
        console.error('Upload error:', err);
      }
    };

    uploadData();
  }, []);

  return (
    <div className="result-page">
      <h1>Status Upload</h1>
      
      {status === 'memproses' && <p>Mempersiapkan data...</p>}
      {status === 'mengupload' && <p>Mengupload data ke Apotek Digital...</p>}
      
      {status === 'berhasil' && (
        <div className="success-message">
          <h2>✅ Upload Berhasil!</h2>
          <p>Data faktur telah berhasil diupload ke sistem Apotek Digital.</p>
          <button onClick={() => window.location.href = '/'}>Upload Faktur Baru</button>
        </div>
      )}
      
      {status === 'gagal' && (
        <div className="error-message">
          <h2>❌ Upload Gagal</h2>
          <p>Terjadi kesalahan: {error}</p>
          <button onClick={() => window.location.href = '/'}>Coba Lagi</button>
        </div>
      )}
    </div>
  );
};

export default ResultPage;