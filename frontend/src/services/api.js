import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// SKU APIs
export const fetchSKUs = async () => {
  const response = await api.get('/skus');
  return response.data;
};

// Truck Type APIs
export const fetchTruckTypes = async () => {
  const response = await api.get('/trucks');
  return response.data;
};

// Calculation APIs
export const calculateOnly = async (data) => {
  const response = await api.post('/calculations/calculate', data);
  return response.data;
};

export const createCalculation = async (data) => {
  const response = await api.post('/calculations', data);
  return response.data;
};

export const fetchCalculations = async () => {
  const response = await api.get('/calculations');
  return response.data;
};

export const searchCalculationsByDestination = async (destination) => {
  const response = await api.get(`/calculations/search?destination=${destination}`);
  return response.data;
};

export const updateCalculation = async (id, data) => {
  const response = await api.put(`/calculations/${id}`, data);
  return response.data;
};

export default api; 