import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import PreviewData from '../components/PreviewData';
import PharmacySelector from '../components/PharmacySelector';
import { processInvoice } from '../services/geminiService';
import { mapProducts } from '../utils/mapping';
import produkMapping from '../data/produkMapping.json';
import { submitInvoice } from '../services/apotekService'; 

const UploadPage = () => {
  const [step, setStep] = useState(1);
  const [invoiceData, setInvoiceData] = useState(null);
  const [priceChanges, setPriceChanges] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (fileData) => {
    setLoading(true);
    try {
      const rawData = await processInvoice(fileData);
      
      // Tambahkan opsi supplier dari data mapping
      const supplierOptions = [...new Set(produkMapping.map(item => item.nama_supplier))];
      
      // Proses mapping produk
      const processedData = {
        ...rawData,
        supplierOptions,
        produk: rawData.produk.map(produk => ({
          ...produk,
          satuanOptions: mapProducts(produk.nama, produkMapping)
        }))
      };
      
      setInvoiceData(processedData);
      setStep(2);
    } catch (error) {
      console.error('Error processing invoice:', error);
      alert('Gagal memproses faktur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value, index = null) => {
    if (index === null) {
      // Edit field utama
      setInvoiceData(prev => ({ ...prev, [field]: value }));
    } else {
      // Edit field produk
      const newProduk = [...invoiceData.produk];
      const fieldName = field.replace('produk_', '');
      
      if (fieldName === 'nama') {
        // Jika nama produk diubah, update opsi satuan
        newProduk[index] = { 
          ...newProduk[index], 
          [fieldName]: value,
          satuanOptions: mapProducts(value, produkMapping)
        };
      } else {
        newProduk[index] = { ...newProduk[index], [fieldName]: value };
      }
      
      setInvoiceData(prev => ({ ...prev, produk: newProduk }));
    }
  };

   const handleSubmit = async () => {
    try {
      // Kirim invoiceData + priceChanges
      const dataToSubmit = {
        ...invoiceData,
        priceChanges
      };
      
      const result = await submitInvoice(dataToSubmit);
      console.log('Invoice submitted:', result);
      
      // Setelah submit berhasil, lanjut ke pemilihan apotek
      setStep(3);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Gagal menyimpan faktur: ' + error.message);
    }
  };

  const handleConfirm = () => {
    // Simulasikan perbandingan harga
    const changes = invoiceData.produk.map(produk => {
      const previousPrice = Math.floor(Math.random() * 50000) + 10000; // Simulasi
      const priceChange = ((produk.harga_beli - previousPrice) / previousPrice) * 100;
      const margin = Math.floor(Math.random() * 30) + 10; // Simulasi margin
      
      return {
        ...produk,
        previous_price: previousPrice,
        price_change: priceChange,
        margin: margin
      };
    });
    
    setPriceChanges(changes);
    setStep(3);
     handleSubmit();
  };

  const handlePharmacySelect = (pharmacy) => {
    // Simpan data ke localStorage untuk halaman berikutnya
    localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    localStorage.setItem('targetPharmacy', JSON.stringify(pharmacy));
    
    // Lanjut ke halaman hasil
    window.location.href = '/result';
  };

  return (
    <div className="upload-page">
      <h1>Upload Faktur Pembelian</h1>
      
      {step === 1 && (
        <>
          <FileUpload onFileUpload={handleFileUpload} />
          {loading && <p>Memproses faktur...</p>}
        </>
      )}
      
      {step === 2 && invoiceData && (
        <PreviewData 
          invoiceData={invoiceData} 
          onEdit={handleEdit}
          onConfirm={handleConfirm}
          priceChanges={priceChanges}
        />
      )}
      
      {step === 3 && (
        <PharmacySelector onSelect={handlePharmacySelect} />
      )}
    </div>
  );
};

export default UploadPage;
