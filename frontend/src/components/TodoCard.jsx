import React from 'react';
import { Link } from 'react-router-dom';

const TodoCard = ({ icon, title, description, subDescription, actionText, actionLink, variant = 'outline', disabled = false }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    backdropFilter: 'blur(10px)',
    transition: 'transform 0.3s',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ marginRight: '1rem' }}>
      {icon}
    </div>
    <div style={{ flexGrow: 1 }}>
      <h2 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600', 
        marginBottom: '0.5rem',
        color: '#333'
      }}>
        {title}
      </h2>
      <p style={{ 
        color: '#666', 
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        {description}
      </p>
      <p style={{ 
        color: '#666',
        fontSize: '0.875rem'
      }}>
        {subDescription}
      </p>
    </div>
    <div style={{ marginLeft: '1rem' }}>
      <Link 
        to={actionLink} 
        style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          transition: 'all 0.2s',
          textDecoration: 'none',
          fontWeight: '600',
          fontSize: '0.875rem',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          pointerEvents: disabled ? 'none' : 'auto',
          ...(variant === 'outline' 
            ? {
                background: 'white',
                color: '#8B5CF6',
                border: '2px solid #8B5CF6'
              }
            : {
                background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
                color: 'white',
                border: 'none',
                boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)'
              })
        }}
        onMouseEnter={(e) => {
          if (variant === 'outline') {
            e.target.style.background = '#f3f4f6';
          } else {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 6px rgba(139, 92, 246, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          if (variant === 'outline') {
            e.target.style.background = 'white';
          } else {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 4px rgba(139, 92, 246, 0.3)';
          }
        }}
      >
        {actionText}
      </Link>
    </div>
  </div>
);

export default TodoCard; 