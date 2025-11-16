import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import apiClient from '../utils/axios';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
  }, [location.state]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/verify-email', { email, code });
      setMessage('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login', { state: { message: 'Email verified. Please log in.' } }), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage('');
    setError('');
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setMessage('If the account is unverified, a new code was sent.');
    } catch (err) {
      setError('Failed to resend code. Try again later.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 25%, #8B5CF6 50%, #4C1D95 75%, #1E1B4B 100%)' }}>
      <PublicHeader />
      <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 420, background: '#181c2f', color: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Verify Email</h2>
          <p style={{ color: '#aaa', marginTop: 0, marginBottom: 16 }}>Enter the 6-digit code we sent to your email.</p>
          <form onSubmit={handleVerify}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', background: '#23264a', color: '#fff', marginBottom: 12 }}
            />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none', background: '#23264a', color: '#fff', marginBottom: 16, letterSpacing: '4px' }}
            />
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, background: 'linear-gradient(90deg, #ff267a 0%, #7f53ac 100%)', color: '#fff', fontWeight: 'bold', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          <div style={{ marginTop: 12 }}>
            <button onClick={handleResend} style={{ background: 'transparent', border: 'none', color: '#7f53ac', cursor: 'pointer', padding: 0 }}>Resend code</button>
          </div>
          {message && <div style={{ color: '#4ade80', marginTop: 12 }}>{message}</div>}
          {error && <div style={{ color: '#ff6b6b', marginTop: 12 }}>{error}</div>}
          <div style={{ marginTop: 16 }}>
            <Link to="/login" style={{ color: '#7f53ac', textDecoration: 'none' }}>Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;


