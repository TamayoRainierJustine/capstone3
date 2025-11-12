import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/PublicHeader';
import apiClient from '../utils/axios';
import { FaUserCircle } from 'react-icons/fa';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });

      // Show success message and redirect to login
      setError('');
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in to continue.' 
        }
      });
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'An error occurred during registration. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 25%, #8B5CF6 50%, #4C1D95 75%, #1E1B4B 100%)' }}>
      <PublicHeader />
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', width: '900px', height: '550px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          {/* Left Panel */}
          <div style={{ background: '#181c2f', color: '#fff', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
            <FaUserCircle size={64} style={{ marginBottom: 32, color: '#7f53ac' }} />
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: 24 }}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', fontSize: 16 }}
                />
              </div>
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(90deg, #ff267a 0%, #7f53ac 100%)', color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', marginBottom: 16, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Creating Account...' : 'SIGN UP'}
              </button>
            </form>
            <div style={{ marginTop: 24, fontSize: 14, color: '#aaa' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#7f53ac', fontWeight: 'bold', textDecoration: 'none' }}>Sign in</Link>
            </div>
            {error && <div style={{ color: '#ff267a', marginTop: 16 }}>{error}</div>}
          </div>
          {/* Right Panel */}
          <div style={{ background: 'rgba(24,28,47,0.95)', color: '#fff', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 16 }}>Create Account</div>
            <div style={{ fontSize: 18, color: '#aaa', textAlign: 'center', maxWidth: 320 }}>Join Structura and start building your store with a beautiful, modern experience.</div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: 'radial-gradient(circle at 60% 40%, #7f53ac55 0%, transparent 70%)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
