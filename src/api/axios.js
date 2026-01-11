import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add XSRF token
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear any local auth state if needed
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // Handle 419 CSRF token mismatch
    if (error.response?.status === 419) {
      // Refresh CSRF token and retry
      return api.get('/sanctum/csrf-cookie').then(() => {
        return api.request(error.config);
      });
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded. Please wait before trying again.');
    }

    return Promise.reject(error);
  }
);

export default api;
