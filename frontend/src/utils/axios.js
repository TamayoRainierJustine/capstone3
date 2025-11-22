// Axios instance with base URL and auth token
import axios from 'axios';
import { API_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Don't redirect if we're on a public route (like published store page)
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath.startsWith('/published/') || 
                            currentPath === '/' || 
                            currentPath === '/login' || 
                            currentPath === '/register' ||
                            currentPath === '/about' ||
                            currentPath === '/services' ||
                            currentPath === '/contact';
      
      // Only clear token, don't redirect on public routes
      // Protected routes (using PrivateRoute component) will handle redirects themselves
      if (!isPublicRoute) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        // On public routes, just clear the token silently
        // Don't redirect - let the user continue viewing the public content
        const token = localStorage.getItem('token');
        if (token) {
          // Only clear token if it exists (avoid clearing customer tokens unnecessarily)
          // For published stores, customers may have valid tokens that shouldn't be cleared
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

