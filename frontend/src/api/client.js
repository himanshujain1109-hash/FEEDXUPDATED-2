import axios from "axios";

// In local dev, Vite's proxy forwards "/api" to the backend (see vite.config.js),
// so the relative path works. In production, the frontend and backend live on
// different domains, so we need the full backend URL — set this in your
// hosting provider's env vars (e.g. Vercel/Netlify): VITE_API_URL=https://your-backend.example.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // generous, since free-tier backends (e.g. Render) can take
  // 30-60s to wake from sleep on the very first request after inactivity
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

// Turns any axios error into a message that actually explains what happened,
// instead of always falling back to a generic "X failed" string. This is the
// difference between "Registration failed" every single time (unhelpful,
// looks identical whether it's a typo'd email or the server being down) and
// a message that tells you which one it actually is.
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  // Server responded, and gave us a message (validation error, duplicate
  // email, wrong password, etc.) — this is the normal, expected case.
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  // Server responded but with no JSON body (e.g. a host's gateway/proxy
  // error page rather than our own errorHandler) — still useful to surface
  // the HTTP status.
  if (err.response?.status) {
    return `Server error (${err.response.status}). Please try again in a moment.`;
  }
  // No response at all reached us: request timed out.
  if (err.code === "ECONNABORTED") {
    return "The server took too long to respond. If it's been idle, it may be waking up — please try again in ~30 seconds.";
  }
  // No response at all, and not a timeout: network failure, CORS block, or
  // the backend is down/crashing. This is the case that used to silently
  // show a generic message with no clue as to the real cause.
  if (err.request) {
    return "Can't reach the server right now. It may be temporarily down or waking up — please try again in a moment.";
  }
  return err.message || fallback;
}

export default api;
