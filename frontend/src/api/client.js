import axios from "axios";

// In local dev, Vite's proxy forwards "/api" to the backend (see vite.config.js),
// so the relative path works. In production, the frontend and backend live on
// different domains, so we need the full backend URL — set this in your
// hosting provider's env vars (e.g. Vercel/Netlify): VITE_API_URL=https://your-backend.example.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fb_token");
      localStorage.removeItem("fb_user");
    }
    return Promise.reject(error);
  }
);

export default api;
