const { getPreviousPrices } = require('../utils/helpers');

const calculatePriceChanges = (currentProducts, previousPrices) => {
  return currentProducts.map(product => {
    const previousProduct = previousPrices.find(p => 
      p.nama.toLowerCase() === product.nama.toLowerCase()
    );
    
    const previousPrice = previousProduct ? previousProduct.harga_beli : null;
    
    let priceChange = 0;
    if (previousPrice && previousPrice > 0) {
      priceChange = ((product.harga_beli - previousPrice) / previousPrice) * 100;
    }
    
    // Hitung margin (simulasi)
    const margin = calculateMargin(product.harga_beli);
    
    return {
      nama: product.nama,
      satuan: product.satuan,
      harga_beli: product.harga_beli,
      previous_price: previousPrice,
      price_change: priceChange,
      margin: margin
    };
  });
};

const calculateMargin = (hargaBeli) => {
  // Simulasi perhitungan margin
  // Dalam implementasi nyata, ini akan mengambil data dari database
  const marginPercentage = 15 + Math.random() * 15; // 15-30%
  return marginPercentage;
};

module.exports = { calculatePriceChanges };