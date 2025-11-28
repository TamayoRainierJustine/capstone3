import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/axios';
import { 
  FaHome, 
  FaStore, 
  FaBox, 
  FaClipboardList, 
  FaChartLine, 
  FaCreditCard, 
  FaTruck, 
  FaCog, 
  FaQuestionCircle, 
  FaEye,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaComments
} from 'react-icons/fa';

const SidebarNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, hasStore, user } = useAuth();
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Save sidebar state to localStorage and update main content margin
  React.useEffect(() => {
    localStorage.setItem('sidebarOpen', isOpen.toString());
    // Update main content margin
    const main = document.getElementById('main-content') || document.querySelector('main');
    if (main) {
      main.style.marginLeft = isOpen ? '256px' : '80px';
    }
  }, [isOpen]);

  // Fetch unread chat count
  React.useEffect(() => {
    if (hasStore && user?.role !== 'super_admin') {
      const fetchUnreadCount = async () => {
        try {
          const response = await apiClient.get('/chat/store/unread-count');
          setUnreadChatCount(response.data.unreadCount || 0);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [hasStore, user]);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      icon: FaHome,
      label: 'Dashboard',
      path: '/dashboard',
      show: true
    },
    {
      icon: FaStore,
      label: 'My Stores',
      path: '/my-stores',
      show: true
    },
    {
      icon: FaBox,
      label: 'Products',
      path: '/dashboard/products',
      show: hasStore
    },
    {
      icon: FaClipboardList,
      label: 'Orders',
      path: '/dashboard/orders',
      show: hasStore
    },
    {
      icon: FaComments,
      label: 'Messages',
      path: '/dashboard/orders',
      state: { openChat: true },
      badge: unreadChatCount > 0 ? unreadChatCount : null,
      show: hasStore && user?.role !== 'super_admin'
    },
    {
      icon: FaChartLine,
      label: 'Sales Analytics',
      path: '/dashboard/analytics',
      show: hasStore
    },
    {
      icon: FaCreditCard,
      label: 'Payment',
      path: '/dashboard/payment',
      show: hasStore
    },
    {
      icon: FaTruck,
      label: 'Shipping',
      path: '/dashboard/shipping',
      show: hasStore
    },
    {
      icon: FaCog,
      label: 'Store Settings',
      path: '/dashboard/store-settings',
      show: hasStore
    },
    {
      icon: FaEye,
      label: 'View Store',
      path: null,
      external: true,
      href: 'http://localhost:5173',
      show: hasStore
    },
    {
      icon: FaQuestionCircle,
      label: 'Help & Support',
      path: '/dashboard/help-chat',
      show: true
    }
  ];

  const filteredItems = menuItems.filter(item => item.show);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        {isMobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-20'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)' }}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <img src="/webicon.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-semibold">Structura</span>
            </div>
          )}
          {!isOpen && (
            <img src="/webicon.png" alt="Logo" className="w-8 h-8 object-contain mx-auto" />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:block p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4">
          <ul className="space-y-1 px-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path || '');
              
              const content = (
                <li key={item.label}>
                  {item.path ? (
                    <Link
                      to={item.path}
                      state={item.state}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      {isOpen && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {item.badge > 9 ? '9+' : item.badge}
                            </span>
                          )}
                        </span>
                      )}
                      {!isOpen && item.badge && item.badge > 0 && (
                        <span className="absolute ml-6 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  ) : item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white`}
                    >
                      <Icon size={20} />
                      {isOpen && <span>{item.label}</span>}
                    </a>
                  ) : null}
                </li>
              );
              return content;
            })}
          </ul>
        </nav>

        {/* Super Admin Link */}
        {user && user.role === 'super_admin' && (
          <div className="absolute bottom-20 left-0 right-0 px-2">
            <Link
              to="/super-admin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname.startsWith('/super-admin')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {isOpen && <span>Super Admin</span>}
            </Link>
          </div>
        )}

        {/* Logout Button */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <FaSignOutAlt size={20} />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};

export default SidebarNav;

