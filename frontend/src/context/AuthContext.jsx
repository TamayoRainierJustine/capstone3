import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../utils/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token and restore user data on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      
      // Restore user data from localStorage if available
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setLoading(false);
        } catch (err) {
          console.warn('Failed to parse stored user data:', err);
          // If parsing fails, try to fetch from backend
          fetchUserData(token);
        }
      } else {
        // No stored user data, fetch from backend
        fetchUserData(token);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      // Try to get user data from backend by making an authenticated request
      // We'll use a simple endpoint that returns user info (like /stores which requires auth)
      const response = await apiClient.get('/stores');
      
      // If stores endpoint works, decode token to get user info
      // For now, try to decode token to get user ID and basic info
      // But better to have a /auth/me endpoint
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        
        // Store minimal user info (will be updated on next login)
        const userData = {
          id: tokenData.id,
          email: tokenData.email,
          role: tokenData.role || 'admin'
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (tokenError) {
        console.warn('Failed to decode token:', tokenError);
        // If we can't decode token but stores request worked, token might be valid
        // Just keep authentication state
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      
      // Only clear authentication if we get a 401 error
      if (error.response?.status === 401) {
        // Token is invalid - clear everything
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      } else {
        // Other errors (network, 500, etc.) - try to use token anyway
        // Decode token to get basic user info
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const userData = {
            id: tokenData.id,
            email: tokenData.email,
            role: tokenData.role || 'admin'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (tokenError) {
          // Can't decode token either - clear auth
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    // Store user data in localStorage for persistence
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setHasStore(false);
    setUser(null);
  };

  const setStoreCreated = () => {
    setHasStore(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      hasStore, 
      user,
      login, 
      logout, 
      setStoreCreated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 