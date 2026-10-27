import axios from "axios";
import { getToken, logout, getAdminToken, adminLogout } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach token without overwriting existing Authorization headers
api.interceptors.request.use(
  (config) => {
    // If the caller already provided an Authorization header, respect it
    if (config.headers?.Authorization) {
      return config;
    }

    const isAdminRoute =
      config.url?.includes("/admin") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/admin"));

    const token = isAdminRoute
      ? (getAdminToken() || getToken())
      : (getToken() || getAdminToken());

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/login")) {
      if (window.location.pathname.startsWith("/admin")) {
        adminLogout();
      } else {
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
