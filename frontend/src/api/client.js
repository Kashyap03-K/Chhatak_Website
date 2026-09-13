import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// --- Global request counter for the top loading bar ---------------------
// A tiny event-based tracker so the LoadingBar component can react to any
// in-flight axios call without needing to know about it explicitly.
let pending = 0;
const dispatch = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:pending', { detail: pending }));
  }
};
export const bumpPending = () => { pending += 1; dispatch(); };
export const dropPending = () => { pending = Math.max(0, pending - 1); dispatch(); };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  bumpPending();
  return config;
});

api.interceptors.response.use(
  (response) => { dropPending(); return response; },
  (error) => {
    dropPending();
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
