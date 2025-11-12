import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PublicHeader = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/register' || location.pathname === '/login';

  return (
    <header className="relative z-50">
      <div className="flex items-center justify-between fixed top-0 left-0 w-full bg-transparent p-4">
        {/* Logo + Brand Name Container */}
        <div className="flex items-center space-x-2">
          <img src="/webicon.png" alt="Logo" className="w-12 h-12 object-contain drop-shadow-lg" />
          <Link to="/" className="text-xl font-semibold text-white hover:text-yellow-200 drop-shadow-md" style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
            Structura
          </Link>
        </div>

        {/* Right Navigation Section - Hidden on register/login pages */}
        {!isAuthPage && (
          <div className="flex items-center space-x-6">
            <Link to="/about" className="text-white hover:text-yellow-200" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
              About
            </Link>
            <Link to="/login" className="text-white hover:text-yellow-200" style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader; 