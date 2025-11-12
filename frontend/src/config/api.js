// API configuration
// Uses environment variable in production, localhost in development

const getApiUrl = () => {
  // In production, use VITE_API_URL from environment if set
  if (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'https://your-project.vercel.app/api') {
    return import.meta.env.VITE_API_URL;
  }
  
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // Fallback: use relative path (same domain) in production
  // This works because API routes are on the same Vercel deployment
  return '/api';
};

export const API_URL = getApiUrl();

// Helper function to make API calls
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

export default API_URL;

