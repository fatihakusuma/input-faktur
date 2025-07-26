import React from 'react';

const PharmacySelector = ({ onSelect }) => {
  const pharmacies = [
    { name: 'Azzahra Piyungan', url: 'https://azpyg.apotekdigital.id/purchase-invoice' },
    { name: 'Adameva Srimulyo', url: 'https://admv1.apotekdigital.id/purchase-invoice' }
  ];

  return (
    <div className="pharmacy-selector">
      <h2>Pilih Apotek Tujuan</h2>
      <div className="pharmacy-options">
        {pharmacies.map((pharmacy, index) => (
          <button 
            key={index} 
            className="pharmacy-card"
            onClick={() => onSelect(pharmacy)}
          >
            {pharmacy.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PharmacySelector;