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
      
      // Check if the request was for a customer endpoint (don't redirect for customer auth errors on public routes)
      const requestUrl = error.config?.url || '';
      const isCustomerEndpoint = requestUrl.includes('/chat/customer/') || 
                                  requestUrl.includes('/auth/customer/');
      
      // Check if this is a request from AuthContext (fetching user data on mount)
      const isAuthContextRequest = requestUrl.includes('/stores') || 
                                    requestUrl.includes('/auth/me');
      
      // On public routes (especially published stores), don't redirect
      // Let the user continue viewing the public content
      // Published stores are viewable without authentication
      if (isPublicRoute || isCustomerEndpoint) {
        // On public routes or customer endpoints, just reject the error without redirecting
        // This allows published stores to work even if there are 401 errors
        // The components will handle these errors gracefully
        return Promise.reject(error);
      }
      
      // For AuthContext requests, don't redirect or clear tokens - let the component handle it
      // The AuthContext will check if token is expired and handle accordingly
      if (isAuthContextRequest) {
        // Don't clear token here - AuthContext will validate it properly
        // Just reject the error and let AuthContext handle validation
        return Promise.reject(error);
      }
      
      // Only redirect to login on protected routes (dashboard, my-stores, etc.)
      // But check if we're already on the login page to avoid redirect loops
      if (currentPath !== '/login') {
        // Clear token first
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we're definitely on a protected route
        const isProtectedRoute = currentPath.startsWith('/dashboard') ||
                                  currentPath.startsWith('/my-stores') ||
                                  currentPath.startsWith('/store-') ||
                                  currentPath.startsWith('/site-builder') ||
                                  currentPath.startsWith('/publish') ||
                                  currentPath.startsWith('/super-admin');
        
        if (isProtectedRoute) {
          // Use setTimeout to avoid redirect during render
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

