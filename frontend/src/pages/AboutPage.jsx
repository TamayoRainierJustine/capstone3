import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './WelcomePage.css';

const AboutPage = () => {
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
          <h1 className="welcome-title">About Us</h1>
          <div className="separator"></div>
          <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
            <p className="welcome-description" style={{ textAlign: 'left', marginBottom: '30px' }}>
              We are a team of fourth-year Information Technology students from Faith Colleges, 
              dedicated to creating innovative solutions that make a difference.
            </p>
            <h2 style={{ 
              color: '#FFD700', 
              fontSize: '28px', 
              marginBottom: '20px', 
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              textAlign: 'center'
            }}>
              Meet Our Team
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginTop: '30px'
            }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '20px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '10px' }}>John Daniel Marquez</h3>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '20px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '10px' }}>Mark Louisse Mendoza</h3>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '20px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '10px' }}>Rufino Quilao</h3>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '20px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '10px' }}>Rainier Justine Tamayo</h3>
              </div>
            </div>
            <p className="welcome-description" style={{ textAlign: 'left', marginTop: '40px' }}>
              Together, we are passionate about leveraging technology to empower Filipino artisans 
              and help them reach a wider audience through our innovative online platform.
            </p>
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

export default AboutPage;

