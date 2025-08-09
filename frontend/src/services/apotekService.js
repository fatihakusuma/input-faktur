import axiosInstance from '../api/axiosConfig';

// Fungsi untuk submit invoice
export const submitInvoice = async (invoiceData) => {
  try {
    const response = await axiosInstance.post('/api/submit-invoice', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error submitting invoice:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan data apotek
export const getPharmacies = async () => {
  try {
    const response = await axiosInstance.get('/api/pharmacies');
    return response.data;
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    throw error;
  }
};

// Fungsi untuk membandingkan harga
export const comparePrices = async (products) => {
  try {
    const response = await axiosInstance.post('/api/compare-prices', { products });
    return response.data;
  } catch (error) {
    console.error('Error comparing prices:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan data invoice
export const getInvoice = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/invoices/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan harga sebelumnya
export const getPreviousPrices = async () => {
  try {
    const response = await axiosInstance.get('/api/previous-prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching previous prices:', error);
    throw error;
  }
};
