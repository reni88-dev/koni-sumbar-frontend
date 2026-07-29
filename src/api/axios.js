import axios from "axios";
import {
  ROLE_ACCESS_DISABLED_EVENT,
  ROLE_ACCESS_DISABLED_MESSAGE,
  ROLE_ACCESS_DISABLED_STORAGE_KEY,
  isRoleAccessDisabledError,
} from "../lib/roleAccess";

const api = axios.create({
  baseURL: "https://api.satudata.konisumbar.or.id",
  // baseURL: 'https://koni-sumbar-backend-golang.ka2h0x.easypanel.host',
  // baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    Accept: "application/json",
  },
});

// Request interceptor to add JWT Bearer token
api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.setContentType(undefined);
  }

  const token = localStorage.getItem("token");
  const publicEndpoints = [
    "/api/login",
    "/api/forgot-password",
    "/api/reset-password/confirm",
  ];
  if (token && !publicEndpoints.includes(config.url)) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url === "/api/login";

    if (isRoleAccessDisabledError(error) && !isLoginRequest) {
      const message = error.response?.data?.message || ROLE_ACCESS_DISABLED_MESSAGE;
      localStorage.removeItem("token");
      sessionStorage.setItem(ROLE_ACCESS_DISABLED_STORAGE_KEY, message);
      window.dispatchEvent(
        new CustomEvent(ROLE_ACCESS_DISABLED_EVENT, { detail: { message } }),
      );
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.error("Rate limit exceeded. Please wait before trying again.");
    }

    return Promise.reject(error);
  },
);

export default api;
