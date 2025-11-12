import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, hasStore, logout } = useAuth();

  return (
    <header className="relative z-50">
      <div className="flex items-center justify-between fixed top-0 left-0 w-full bg-transparent p-4">
        {/* Logo + Brand Name Container */}
        <div className="flex items-center space-x-2">
          <img src="/webicon.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
          <Link 
            to="/dashboard" 
            state={{ skipRedirect: true }}
            className="text-xl font-semibold text-white hover:text-yellow-200 drop-shadow-md" 
            style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}
          >
            Structura
          </Link>
        </div>

        {/* Empty middle section for spacing */}
        <div className="flex-1"></div>

        {/* Right Navigation Section */}
        <div className="flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link 
                to="/my-stores"
                className="inline-flex items-center text-white hover:text-yellow-200"
                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                My Stores
              </Link>
              {hasStore && (
                <>
                  <a 
                    href="http://localhost:5173" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-white hover:text-yellow-200"
                    style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Store
                  </a>
                  <button 
                    className="inline-flex items-center text-white hover:text-yellow-200"
                    style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Deploy
                  </button>
                </>
              )}
              <button
                onClick={logout}
                className="text-white hover:text-yellow-200"
                style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}
              >
                Sign Out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
