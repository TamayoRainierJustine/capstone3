import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import apiClient from '../utils/axios';
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { PASSWORD_REQUIREMENTS_TEXT, passwordMeetsRequirements } from '../utils/passwordRules';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

    if (!passwordMeetsRequirements(formData.password)) {
      setError(PASSWORD_REQUIREMENTS_TEXT);
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

      setError('');
      navigate('/verify-email', { 
        replace: true,
        state: { 
          email: formData.email,
          message: 'We sent a verification link and code to your email. Please verify to continue.',
          returnUrl: location.state?.returnUrl
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
                  autoComplete="given-name"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  autoComplete="family-name"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 12, fontSize: 16 }}
                />
                <div style={{ position: 'relative', width: '100%', marginBottom: 6 }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
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
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
                  {PASSWORD_REQUIREMENTS_TEXT}
                </div>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '12px 16px', paddingRight: '45px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', fontSize: 16 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(90deg, #ff267a 0%, #7f53ac 100%)', color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', marginBottom: 16, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Creating Account...' : 'SIGN UP'}
              </button>
            </form>
            <div style={{ marginTop: 24, fontSize: 14, color: '#aaa' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                state={location.state?.returnUrl ? { returnUrl: location.state.returnUrl } : undefined}
                style={{ color: '#7f53ac', fontWeight: 'bold', textDecoration: 'none' }}
              >
                Sign in
              </Link>
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
