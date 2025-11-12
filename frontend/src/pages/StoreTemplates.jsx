import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/StoreTemplates.css';

const StoreTemplates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    // Check if we should show notification from location state
    console.log('StoreTemplates location.state:', location.state);
    if (location.state?.showNotification) {
      console.log('Showing notification:', location.state.notificationMessage);
      setShowNotification(true);
      setNotificationMessage(location.state.notificationMessage || 'Welcome! Create your first store to get started.');
      
      // Clear the state after a short delay to ensure it's read
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  // Map template IDs to HTML file names
  const templateFileMap = {
    bladesmith: 'struvaris.html',
    pottery: 'truvara.html',
    balisong: 'ructon.html',
    weavery: 'urastra.html',
    woodcarving: 'caturis.html'
  };

  const templates = [
    {
      id: 'bladesmith',
      title: 'Struvaris',
      colorPalette: ['#0a0a0a', '#1a1a1a', '#c9a961', '#e0e0e0'],
      isPopular: true
    },
    {
      id: 'pottery',
      title: 'Truvara',
      colorPalette: ['#faf8f3', '#ede8dc', '#8b6f47', '#d4a574', '#5c4033']
    },
    {
      id: 'balisong',
      title: 'Ructon',
      colorPalette: ['#0f0f23', '#1a1b3e', '#6366f1', '#8b5cf6', '#e4e4e7']
    },
    {
      id: 'weavery',
      title: 'Urastra',
      colorPalette: ['#ffffff', '#faf9f7', '#8b6f47', '#2c2c2c', '#e8e8e8']
    },
    {
      id: 'woodcarving',
      title: 'Caturis',
      colorPalette: ['#f5efe6', '#8b6f47', '#6b4e37', '#4a3728', '#d4c4b0']
    }
  ];

  return (
    <div className="templates-page">
      <Header />
      
      {/* Notification Toast */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          animation: 'slideDown 0.3s ease-out',
          maxWidth: '500px',
          width: '90%'
        }}>
          <div style={{
            fontSize: '1.5rem'
          }}>
            👋
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: '500' }}>
              {notificationMessage}
            </p>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="templates-content">
        <div className="templates-header">
          <p className="select-template-text">Select a template that best fits your craft business</p>
        </div>

        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-preview">
                <iframe
                  src={`/templates/${templateFileMap[template.id]}`}
                  className="template-iframe"
                  title={`${template.title} Preview`}
                  scrolling="no"
                />
                {template.isPopular && <div className="template-badge">Popular</div>}
              </div>
              <div className="template-info">
                <h3 className="template-title">{template.title}</h3>
                {/* Color Palette Display */}
                <div className="color-palette">
                  <p className="color-palette-label">Color Palette:</p>
                  <div className="color-swatches">
                    {template.colorPalette.map((color, index) => (
                      <div
                        key={index}
                        className="color-swatch"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="template-buttons">
                  <Link to={`/store/${template.id}`} className="preview-button">
                    <i className="fas fa-eye"></i> Preview Template
                  </Link>
                  <button 
                    onClick={() => navigate('/store-setup', { state: { templateId: template.id } })}
                    className="select-button"
                  >
                    <i className="fas fa-check"></i> Use This Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreTemplates; 