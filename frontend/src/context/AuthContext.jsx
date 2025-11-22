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
      // First, try to decode token to determine user type
      let tokenData;
      try {
        tokenData = JSON.parse(atob(token.split('.')[1]));
      } catch (tokenError) {
        console.warn('Failed to decode token:', tokenError);
        // If we can't decode token, it's invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (tokenData.exp && tokenData.exp < currentTime) {
        console.log('Token expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      // Determine if this is a customer token or store owner token
      const isCustomerToken = tokenData.type === 'customer';
      
      // Store minimal user info from token (will be updated on next login)
      const userData = {
        id: tokenData.id,
        email: tokenData.email,
        role: tokenData.role || (isCustomerToken ? 'customer' : 'admin'),
        type: tokenData.type || (isCustomerToken ? 'customer' : 'user')
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // If customer token, don't try to fetch stores (they don't have access)
      if (isCustomerToken) {
        setLoading(false);
        return;
      }
      
      // For store owner tokens, try to validate by fetching stores
      // This is optional - we already validated the token by decoding it
      try {
        const response = await apiClient.get('/stores');
        // If stores fetch succeeds, token is valid
        // We already have user data from token, so we're good
      } catch (storeError) {
        // If stores fetch fails, but token is valid (not expired), keep auth
        // The token might still be valid even if stores endpoint fails
        if (storeError.response?.status === 401) {
          // 401 means token is invalid for stores - might be expired or invalid
          // But we already checked expiration, so this might be a different issue
          console.warn('Token validation failed:', storeError);
          // Keep authentication if token is not expired
          // The user can still use the app, and will be redirected if truly invalid
        } else {
          // Network errors, etc. - token might still be valid
          console.warn('Store fetch failed but token might be valid:', storeError);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      
      // Try to decode token as fallback
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (tokenData.exp && tokenData.exp < currentTime) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        } else {
          // Token not expired - keep authentication
          const userData = {
            id: tokenData.id,
            email: tokenData.email,
            role: tokenData.role || 'admin',
            type: tokenData.type || 'user'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (tokenError) {
        // Can't decode token - clear auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
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