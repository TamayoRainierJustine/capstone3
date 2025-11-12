import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './WelcomePage.css';

const WelcomePage = () => {
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
          <h1 className="welcome-title">Welcome Home</h1>
          <div className="separator"></div>
          <p className="welcome-description">
            Create your dream store in a warm, welcoming environment.
            <br />
            Where every business feels like home.
          </p>
          <div className="cta-container">
            <Link to="/register" className="cta-button primary">
              Start Your Journey
            </Link>
            <Link to="/login" className="cta-button secondary">
              Welcome Back
            </Link>
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

export default WelcomePage;
