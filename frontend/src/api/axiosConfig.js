import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api'  // Untuk production di Vercel
    : 'http://localhost:5000/api',  // Untuk development
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor untuk menangani error global
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
