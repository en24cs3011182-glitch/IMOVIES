import axios from 'axios';
import { toast } from 'react-toastify';

export const API_HOST = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
export const API_BASE = `${API_HOST}/api`;

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('imovies_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    toast.error(getErrorMessage(error));
    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Something went wrong';
}

export default api;
