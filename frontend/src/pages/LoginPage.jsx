// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/PublicHeader';
import apiClient from '../utils/axios';
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for success message from registration or return URL
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
    if (location.state?.returnUrl) {
      // Store return URL in component state if needed
      console.log('Return URL set:', location.state.returnUrl);
    }
  }, [location]);

  // Handle verify link redirect (?verified=1)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
    const reason = params.get('reason');
    if (verified === '1') {
      setSuccess('Email verified. Please log in.');
    } else if (verified === '0') {
      setError(reason === 'invalid_or_expired' ? 'Verification link is invalid or expired.' : 'Email verification failed. Please request a new link.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        // Store the token in localStorage
        const token = response.data.token;
        localStorage.setItem('token', token);
        
        // Update auth context with user data first
        login(response.data.user);
        
        // Small delay to ensure auth context is updated before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if there's a return URL (e.g., from published store)
        const returnUrl = location.state?.returnUrl;
        if (returnUrl && returnUrl.startsWith('/published/')) {
          // Redirect back to the published store
          console.log('Redirecting back to published store:', returnUrl);
          navigate(returnUrl, { replace: true });
          return;
        }
        
        // Check if user has a store
        try {
          const storesResponse = await apiClient.get('/stores');

          const storeCount = storesResponse.data ? storesResponse.data.length : 0;
          console.log('Store count after login:', storeCount);

          // Redirect based on store count
          if (storeCount === 0) {
            // No stores - redirect to store templates with notification
            console.log('No stores found, redirecting to store-templates');
            navigate('/store-templates', { 
              state: { 
                showNotification: true,
                notificationMessage: 'Welcome! Create your first store to get started.'
              },
              replace: true
            });
          } else {
            // One or more stores - redirect to My Stores page
            console.log(`${storeCount} store(s) found, redirecting to my-stores`);
            navigate('/my-stores', { replace: true });
          }
        } catch (storeError) {
          // If store check fails, check if it's a 404 (no stores) or actual error
          console.error('Error checking stores:', storeError);
          if (storeError.response?.status === 404 || (storeError.response?.data && Array.isArray(storeError.response.data) && storeError.response.data.length === 0)) {
            // No stores found - redirect to store templates
            console.log('No stores (404 or empty), redirecting to store-templates');
            navigate('/store-templates', { 
              state: { 
                showNotification: true,
                notificationMessage: 'Welcome! Create your first store to get started.'
              },
              replace: true
            });
          } else {
            // Actual error - redirect to store templates as fallback for new users
            console.log('Store check error, redirecting to store-templates as fallback');
            navigate('/store-templates', { 
              state: { 
                showNotification: true,
                notificationMessage: 'Welcome! Create your first store to get started.'
              },
              replace: true
            });
          }
        }
      } else {
        setError('No token received from server');
      }
    } catch (error) {
      const msg = error.response?.data?.message;
      if (error.response?.status === 403) {
        setError(msg || 'Please verify your email to continue.');
      } else {
        setError(
          msg || 'An error occurred during login. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 25%, #8B5CF6 50%, #4C1D95 75%, #1E1B4B 100%)' }}>
      <PublicHeader />
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', width: '900px', height: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          {/* Left Panel */}
          <div style={{ background: '#181c2f', color: '#fff', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
            <FaUserCircle size={64} style={{ marginBottom: 32, color: '#7f53ac' }} />
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: 24 }}>
                <input
                  type="email"
                  placeholder="Username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 16, fontSize: 16 }}
                />
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 16px', paddingRight: '45px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', fontSize: 16 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#aaa',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#fff'}
                    onMouseLeave={(e) => e.target.style.color = '#aaa'}
                  >
                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(90deg, #ff267a 0%, #7f53ac 100%)', color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', marginBottom: 16, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Signing in...' : 'LOGIN'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#aaa' }}>
                <span>
                  <input type="checkbox" id="remember-me" style={{ marginRight: 6 }} /> Remember me
                </span>
                <Link to="/forgot-password" style={{ color: '#7f53ac', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
            </form>
            <div style={{ marginTop: 24, fontSize: 14, color: '#aaa' }}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                state={location.state?.returnUrl ? { returnUrl: location.state.returnUrl } : undefined}
                style={{ color: '#7f53ac', fontWeight: 'bold', textDecoration: 'none' }}
              >
                Sign up
              </Link>
            </div>
            {error && <div style={{ color: '#ff267a', marginTop: 16 }}>{error}</div>}
            {success && <div style={{ color: '#4ade80', marginTop: 16 }}>{success}</div>}
          </div>
          {/* Right Panel */}
          <div style={{ background: 'rgba(24,28,47,0.95)', color: '#fff', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 16 }}>Welcome.</div>
            <div style={{ fontSize: 18, color: '#aaa', textAlign: 'center', maxWidth: 320 }}>Sign in to access your dashboard and manage your store with ease.</div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: 'radial-gradient(circle at 60% 40%, #7f53ac55 0%, transparent 70%)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
