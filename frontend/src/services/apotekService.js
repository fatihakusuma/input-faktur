import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const submitToApotekDigital = async (invoiceData, pharmacyUrl) => {
  try {
    const response = await axios.post(`${API_URL}/submit-invoice`, {
      invoiceData,
      pharmacyUrl
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting to Apotek Digital:', error);
    throw new Error(error.response?.data?.error || 'Gagal mengupload faktur');
  }
};