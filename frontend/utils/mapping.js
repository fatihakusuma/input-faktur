// Fungsi untuk mapping produk dan satuan
export const mapProducts = (productName, mappingData) => {
  const matchedProducts = mappingData.filter(item => 
    productName.toLowerCase().includes(item.nama_faktur.toLowerCase()) ||
    item.nama_faktur.toLowerCase().includes(productName.toLowerCase())
  );

  if (matchedProducts.length > 0) {
    // Gabungkan semua satuan yang mungkin
    const allUnits = matchedProducts.reduce((units, product) => {
      return [...units, product.satuan_utama, ...(product.semua_satuan || [])];
    }, []);
    
    // Hapus duplikat
    return [...new Set(allUnits)];
  }

  // Default jika tidak ditemukan
  return ['Tablet', 'Strip', 'Botol', 'Kapsul', 'Tube', 'Pcs'];
};