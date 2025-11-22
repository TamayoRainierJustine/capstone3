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
      
      // On public routes (especially published stores), don't redirect
      // Let the user continue viewing the public content
      // Published stores are viewable without authentication
      if (!isPublicRoute) {
        // Only redirect to login on protected routes
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // On public routes, just silently fail - don't redirect or clear tokens
      // This allows published stores to work even if there are 401 errors
    }
    return Promise.reject(error);
  }
);

export default apiClient;

