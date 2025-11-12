// src/layouts/DashboardLayout.jsx
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      height: '100%',
      background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 25%, #8B5CF6 50%, #4C1D95 75%, #1E1B4B 100%)',
      backgroundAttachment: 'fixed',
      width: '100%',
      margin: 0,
      padding: 0,
      position: 'relative',
      overflow: 'auto'
    }}>
      <Header />
      <main style={{
        marginTop: '80px',
        minHeight: 'calc(100vh - 80px)',
        width: '100%',
        margin: 0,
        padding: 0,
        background: 'transparent'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
