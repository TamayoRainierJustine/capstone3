// src/layouts/DashboardLayout.jsx
import { useEffect } from 'react';
import SidebarNav from '../components/SidebarNav';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  useEffect(() => {
    // Set initial margin based on sidebar state
    const sidebarOpen = localStorage.getItem('sidebarOpen');
    const isOpen = sidebarOpen !== null ? sidebarOpen === 'true' : true;
    const main = document.getElementById('main-content');
    if (main) {
      main.style.marginLeft = isOpen ? '256px' : '80px';
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SidebarNav />
      <main 
        id="main-content"
        className="flex-1 overflow-y-auto transition-all duration-300"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 25%, #8B5CF6 50%, #4C1D95 75%, #1E1B4B 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh'
        }}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
