import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import PreviewData from '../components/PreviewData';
import PharmacySelector from '../components/PharmacySelector';
import { processInvoice } from '../services/geminiService';
import { mapProducts } from '../utils/mapping';
import produkMapping from '../data/produkMapping.json';
import { submitInvoice, getPharmacies } from '../services/apotekService'; // Perhatikan perubahan impor

const UploadPage = () => {
  const [step, setStep] = useState(1);
  const [invoiceData, setInvoiceData] = useState(null);
  const [priceChanges, setPriceChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState([]); // State untuk menyimpan daftar apotek
  const [pharmacyLoading, setPharmacyLoading] = useState(false); // Loading khusus apotek
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Reset state saat komponen dimount
  useEffect(() => {
    localStorage.removeItem('invoiceData');
    localStorage.removeItem('targetPharmacy');
    
    // Ambil daftar apotek
    const fetchPharmacies = async () => {
      setPharmacyLoading(true);
      try {
        const data = await getPharmacies();
        setPharmacies(data);
      } catch (error) {
        console.error('Failed to fetch pharmacies:', error);
        setSubmitStatus('error');
        setErrorMessage('Gagal memuat daftar apotek');
      } finally {
        setPharmacyLoading(false);
      }
    };
    
    fetchPharmacies();
  }, []);

  const handleFileUpload = async (fileData) => {
    setLoading(true);
    setSubmitStatus(null);
    setErrorMessage('');
    
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
      setSubmitStatus('error');
      setErrorMessage('Gagal memproses faktur: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field, value, index = null) => {
    if (index === null) {
      setInvoiceData(prev => ({ ...prev, [field]: value }));
    } else {
      const newProduk = [...invoiceData.produk];
      const fieldName = field.replace('produk_', '');
      
      if (fieldName === 'nama') {
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

  const simulatePriceChanges = () => {
    const changes = invoiceData.produk.map(produk => {
      const previousPrice = Math.floor(Math.random() * 50000) + 10000;
      const priceChange = ((produk.harga_beli - previousPrice) / previousPrice) * 100;
      const margin = Math.floor(Math.random() * 30) + 10;
      
      return {
        ...produk,
        previous_price: previousPrice,
        price_change: priceChange,
        margin: margin
      };
    });
    
    return changes;
  };

  const handleConfirm = async () => {
    setLoading(true);
    setSubmitStatus(null);
    setErrorMessage('');
    
    try {
      // 1. Simulasi perubahan harga
      const changes = simulatePriceChanges();
      setPriceChanges(changes);
      
      // 2. Submit data ke backend
      const dataToSubmit = {
        ...invoiceData,
        priceChanges: changes
      };
      
      // Kirim ke backend
      await submitInvoice(dataToSubmit);
      
      // 3. Lanjut ke step pemilihan apotek
      setStep(3);
      setSubmitStatus('success');
    } catch (error) {
      console.error('Submission failed:', error);
      setSubmitStatus('error');
      setErrorMessage('Gagal menyimpan faktur: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePharmacySelect = async (pharmacy) => {
    setLoading(true);
    setSubmitStatus(null);
    setErrorMessage('');
    
    try {
      // Submit data lengkap dengan apotek pilihan
      const finalData = {
        ...invoiceData,
        priceChanges,
        selectedPharmacy: pharmacy
      };
      
      await submitInvoice(finalData);
      
      // Simpan ke localStorage
      localStorage.setItem('invoiceData', JSON.stringify(finalData));
      localStorage.setItem('targetPharmacy', JSON.stringify(pharmacy));
      
      // Lanjut ke halaman hasil
      window.location.href = '/result';
    } catch (error) {
      console.error('Failed to save with pharmacy:', error);
      setSubmitStatus('error');
      setErrorMessage('Gagal menyimpan pilihan apotek: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 upload-page">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h1 className="text-center">Upload Faktur Pembelian</h1>
        </div>
        
        <div className="card-body">
          {submitStatus === 'error' && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {errorMessage}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSubmitStatus(null)}
                aria-label="Close"
              ></button>
            </div>
          )}
          
          {submitStatus === 'success' && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Data faktur berhasil disimpan!
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSubmitStatus(null)}
                aria-label="Close"
              ></button>
            </div>
          )}
          
          {(loading || pharmacyLoading) && (
            <div className="d-flex justify-content-center align-items-center my-5 py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-3">Memproses...</span>
            </div>
          )}
          
          {!loading && !pharmacyLoading && step === 1 && (
            <div className="text-center">
              <FileUpload onFileUpload={handleFileUpload} />
              <p className="mt-3 text-muted">
                Unggah file faktur dalam format PDF atau gambar (JPG/PNG)
              </p>
            </div>
          )}
          
          {!loading && !pharmacyLoading && step === 2 && invoiceData && (
            <PreviewData 
              invoiceData={invoiceData} 
              onEdit={handleEdit}
              onConfirm={handleConfirm}
            />
          )}
          
          {!loading && !pharmacyLoading && step === 3 && (
            <div>
              <h2 className="mb-4">Pilih Apotek Tujuan</h2>
              <PharmacySelector 
                pharmacies={pharmacies} 
                onSelect={handlePharmacySelect} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
