// Format tanggal untuk tampilan
export const formatDate = (dateString) => {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Format mata uang
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Hitung total per produk setelah diskon dan pajak
export const calculateProductTotal = (product) => {
  const subtotal = product.harga_beli * product.kuantitas * (1 - (product.diskon || 0) / 100);
  const tax = subtotal * 0.11;
  return subtotal + tax;
};

// Hitung total faktur
export const calculateInvoiceTotal = (products) => {
  return products.reduce((total, product) => {
    return total + calculateProductTotal(product);
  }, 0);
};