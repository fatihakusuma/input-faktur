import React from 'react';
import PriceComparison from './PriceComparison';

const PreviewData = ({ 
  invoiceData, 
  onEdit, 
  onConfirm,
  priceChanges
}) => {
  const handleEdit = (field, value, index = null) => {
    onEdit(field, value, index);
  };

  return (
    <div className="preview-data">
      <h2>Preview Data Faktur</h2>
      
      <div className="form-group">
        <label>Supplier:</label>
        <select 
          value={invoiceData.supplier} 
          onChange={(e) => handleEdit('supplier', e.target.value)}
        >
          <option value="">Pilih Supplier</option>
          {invoiceData.supplierOptions?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>No. Faktur (4 digit):</label>
        <input 
          type="text" 
          value={invoiceData.no_faktur} 
          onChange={(e) => handleEdit('no_faktur', e.target.value)}
          maxLength={4}
        />
      </div>

      <div className="form-group">
        <label>Tanggal Faktur:</label>
        <input 
          type="date" 
          value={invoiceData.tanggal_faktur} 
          onChange={(e) => handleEdit('tanggal_faktur', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Jenis Faktur:</label>
        <select 
          value={invoiceData.jenis_faktur} 
          onChange={(e) => handleEdit('jenis_faktur', e.target.value)}
        >
          <option value="Harga Belum Termasuk Pajak">Harga Belum Termasuk Pajak</option>
          <option value="Harga Sudah Termasuk Pajak">Harga Sudah Termasuk Pajak</option>
          <option value="Tidak Termasuk Pajak">Tidak Termasuk Pajak</option>
        </select>
      </div>

      <div className="form-group">
        <label>Jenis Pembayaran:</label>
        <select 
          value={invoiceData.jenis_pembayaran} 
          onChange={(e) => handleEdit('jenis_pembayaran', e.target.value)}
        >
          <option value="Kredit">Kredit</option>
          <option value="Tunai">Tunai</option>
        </select>
      </div>

      {invoiceData.jenis_pembayaran === 'Kredit' && (
        <div className="form-group">
          <label>Tempo Pembayaran (hari):</label>
          <input 
            type="number" 
            value={invoiceData.tempo_pembayaran} 
            onChange={(e) => handleEdit('tempo_pembayaran', e.target.value)}
          />
        </div>
      )}

      <h3>Produk:</h3>
      {invoiceData.produk.map((produk, index) => (
        <div key={index} className="product-item">
          <div className="form-group">
            <label>Nama Produk:</label>
            <input 
              type="text" 
              value={produk.nama} 
              onChange={(e) => handleEdit('produk_nama', e.target.value, index)}
            />
          </div>
          
          <div className="form-group">
            <label>Kuantitas:</label>
            <input 
              type="number" 
              value={produk.kuantitas} 
              onChange={(e) => handleEdit('produk_kuantitas', e.target.value, index)}
            />
          </div>
          
          <div className="form-group">
            <label>Satuan:</label>
            <select 
              value={produk.satuan} 
              onChange={(e) => handleEdit('produk_satuan', e.target.value, index)}
            >
              {produk.satuanOptions?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Harga Beli:</label>
            <input 
              type="number" 
              value={produk.harga_beli} 
              onChange={(e) => handleEdit('produk_harga_beli', e.target.value, index)}
            />
          </div>
          
          <div className="form-group">
            <label>Diskon (%):</label>
            <input 
              type="number" 
              value={produk.diskon} 
              onChange={(e) => handleEdit('produk_diskon', e.target.value, index)}
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label>Expired Date:</label>
            <input 
              type="date" 
              value={produk.expired_date} 
              onChange={(e) => handleEdit('produk_expired_date', e.target.value, index)}
            />
          </div>
          
          <div className="form-group">
            <label>No. Batch:</label>
            <input 
              type="text" 
              value={produk.no_batch} 
              onChange={(e) => handleEdit('produk_no_batch', e.target.value, index)}
            />
          </div>
        </div>
      ))}

      {priceChanges.length > 0 && (
        <PriceComparison changes={priceChanges} />
      )}

      <button onClick={onConfirm}>Konfirmasi dan Lanjut</button>
    </div>
  );
};

export default PreviewData;