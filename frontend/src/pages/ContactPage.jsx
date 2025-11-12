import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './WelcomePage.css';

const ContactPage = () => {
  const location = useLocation();
  return (
    <div className="welcome-page">
      {/* Background with mountains and landscape */}
      <div className="landscape-background">
        <div className="moon"></div>
        <div className="stars">
          <div className="star star-1"></div>
          <div className="star star-2"></div>
          <div className="star star-3"></div>
          <div className="star star-4"></div>
          <div className="star star-5"></div>
        </div>
        <div className="mountains">
          <div className="mountain-layer mountain-1"></div>
          <div className="mountain-layer mountain-2"></div>
          <div className="mountain-layer mountain-3"></div>
        </div>
        <div className="trees">
          <div className="tree tree-1"></div>
          <div className="tree tree-2"></div>
          <div className="tree tree-3"></div>
          <div className="tree tree-4"></div>
          <div className="tree tree-5"></div>
          <div className="tree tree-6"></div>
        </div>
        <div className="cliff"></div>
        <div className="fog-layer"></div>
      </div>

      {/* Header */}
      <header className="welcome-header">
        <div className="logo-container">
          <img src="/logoweb.png" alt="Structura Logo" className="logo-image" />
        </div>
        <div className="logo-text">Structura</div>
        <nav className="welcome-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>About us</Link>
          <Link to="/services" className={`nav-link ${location.pathname === '/services' ? 'active' : ''}`}>Service</Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="welcome-content">
        <div className="welcome-text">
          <h1 className="welcome-title">Contact Us</h1>
          <div className="separator"></div>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
            <p className="welcome-description" style={{ marginBottom: '40px' }}>
              We'd love to hear from you! If you have any questions, feedback, or inquiries 
              about our platform, please feel free to reach out to us.
            </p>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              padding: '40px', 
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              marginTop: '30px'
            }}>
              <h2 style={{ 
                color: '#FFD700', 
                fontSize: '32px', 
                marginBottom: '30px', 
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                Faith Colleges
              </h2>
              <p className="welcome-description" style={{ marginBottom: '20px' }}>
                We are students from Faith Colleges, working on this capstone project 
                to support Filipino artisans in their journey to digital success.
              </p>
              <p className="welcome-description" style={{ margin: 0 }}>
                For more information about our institution, please visit Faith Colleges 
                or contact the administration office.
              </p>
            </div>
            <div style={{ marginTop: '40px' }}>
              <Link to="/register" className="cta-button primary" style={{ marginRight: '10px' }}>
                Get Started
              </Link>
              <Link to="/" className="cta-button secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="welcome-footer">
        <p className="footer-text">
          Made with ❤️ by the Structura team
        </p>
      </footer>
    </div>
  );
};

export default ContactPage;

