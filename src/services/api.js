import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1', // Points to your Spring Boot backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT token if it exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;