// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WelcomePage from './pages/WelcomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import StoreSetup from './pages/StoreSetup';
import StoreTemplates from './pages/StoreTemplates';
import PrivateRoute from './components/PrivateRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import DashboardLayout from './components/DashboardLayout';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Payment from './pages/Payment';
import Shipping from './pages/Shipping';
import SiteBuilder from './pages/SiteBuilder';
import Settings from './pages/Settings';
import TemplatePreview from './pages/TemplatePreview';
import PublishPage from './pages/PublishPage';
import PublishedStore from './pages/PublishedStore';
import Products from './pages/Products';
import Orders from './pages/Orders';
import SalesAnalytics from './pages/SalesAnalytics';
import MyStores from './pages/MyStores';
import ShareSocial from './pages/ShareSocial';
import StoreSettings from './pages/StoreSettings';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminTickets from './pages/SuperAdminTickets';
import SuperAdminOrders from './pages/SuperAdminOrders';
import HelpChat from './pages/HelpChat';
import BladesmithStore from './pages/stores/BladesmithStore';
import PotteryStore from './pages/stores/PotteryStore';
import BalisongStore from './pages/stores/BalisongStore';
import './App.css';

const DynamicStore = () => {
  const { templateId } = useParams();
  
  const storeComponents = {
    bladesmith: BladesmithStore,
    pottery: PotteryStore,
    balisong: BalisongStore
  };

  const StoreComponent = storeComponents[templateId];
  
  if (!StoreComponent) {
    return <div>Store template not found</div>;
  }

  return <StoreComponent />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          <Route path="/" element={<WelcomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Public route for published websites */}
          <Route path="/published/:domain" element={<PublishedStore />} />
          
          <Route path="/store-templates" element={<PrivateRoute><StoreTemplates /></PrivateRoute>} />
          <Route path="/store/:templateId" element={<PrivateRoute><TemplatePreview /></PrivateRoute>} />
          <Route path="/store-setup" element={<PrivateRoute><StoreSetup /></PrivateRoute>} />
          <Route path="/my-stores" element={<PrivateRoute><MyStores /></PrivateRoute>} />
          
          {/* Dashboard routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="addproducts" element={<AddProduct />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id/edit" element={<EditProduct />} />
            <Route path="orders" element={<Orders />} />
            <Route path="analytics" element={<SalesAnalytics />} />
            <Route path="payment" element={<Payment />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="settings" element={<Settings />} />
            <Route path="store-settings" element={<StoreSettings />} />
            <Route path="share-social" element={<ShareSocial />} />
            <Route path="help-chat" element={<HelpChat />} />
          </Route>

          {/* Super Admin routes */}
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
          <Route path="/super-admin/orders" element={<SuperAdminRoute><SuperAdminOrders /></SuperAdminRoute>} />
          <Route path="/super-admin/tickets" element={<SuperAdminRoute><SuperAdminTickets /></SuperAdminRoute>} />

          {/* Site Builder route */}
          <Route path="/site-builder" element={<PrivateRoute><SiteBuilder /></PrivateRoute>} />
          
          {/* Publish page */}
          <Route path="/publish" element={<PrivateRoute><PublishPage /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
