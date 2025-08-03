import axiosInstance from '../api/axiosConfig';;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Fungsi untuk submit invoice
export const submitInvoice = async (invoiceData) => {
  try {
    const response = await axiosInstance.post('/submit', invoiceData);
    return response.data;
  } catch (error) {
    console.error('Error submitting invoice:', error);
    throw error;
  }
};

// Fungsi untuk mendapatkan data apotek
export const getPharmacies = async () => {
  try {
    const response = await axiosInstance.get('/apotek');
    return response.data;
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    throw error;
  }
};
