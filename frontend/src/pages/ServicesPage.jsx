import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './WelcomePage.css';

const ServicesPage = () => {
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
          <h1 className="welcome-title">Our Services</h1>
          <div className="separator"></div>
          <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
            <p className="welcome-description" style={{ textAlign: 'left', marginBottom: '30px' }}>
              As part of our capstone project, we are developing an innovative online platform 
              designed specifically for Filipino artisans. Our mission is to provide them with 
              the tools and resources they need to establish and grow their online presence.
            </p>
            <h2 style={{ 
              color: '#FFD700', 
              fontSize: '28px', 
              marginBottom: '20px', 
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              marginTop: '40px'
            }}>
              What We Offer
            </h2>
            <div style={{ marginTop: '30px' }}>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '25px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '22px' }}>
                  Online Store Platform
                </h3>
                <p className="welcome-description" style={{ textAlign: 'left', margin: 0 }}>
                  We provide Filipino artisans with a comprehensive online store platform that 
                  enables them to showcase their products and reach customers beyond their local 
                  communities. Our system offers an easy-to-use interface for managing products, 
                  orders, and customer interactions.
                </p>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '25px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '22px' }}>
                  Expanded Customer Reach
                </h3>
                <p className="welcome-description" style={{ textAlign: 'left', margin: 0 }}>
                  Through our platform, artisans can connect with a much wider customer base, 
                  breaking geographical barriers and expanding their market reach. Our system 
                  facilitates seamless transactions and helps artisans grow their businesses 
                  in the digital marketplace.
                </p>
              </div>
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '25px', 
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ color: '#FFD700', marginBottom: '15px', fontSize: '22px' }}>
                  Customizable Store Templates
                </h3>
                <p className="welcome-description" style={{ textAlign: 'left', margin: 0 }}>
                  We offer a variety of beautiful, customizable store templates that allow 
                  artisans to create a unique online presence that reflects their brand and 
                  showcases their craftsmanship. Each template is designed to be user-friendly 
                  and mobile-responsive.
                </p>
              </div>
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

export default ServicesPage;

