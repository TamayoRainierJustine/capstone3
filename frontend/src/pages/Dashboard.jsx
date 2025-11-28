// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation, Link } from 'react-router-dom';
import apiClient from '../utils/axios';
import TodoCard from '../components/TodoCard';

const Payment = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-4">Payment Setup</h1>
    <p className="text-gray-600 mb-4">Configure your payment settings here.</p>
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option>Stripe</option>
          <option>PayPal</option>
          <option>Square</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">API Key</label>
        <input type="text" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" placeholder="Enter your API key" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Settings</button>
    </form>
  </div>
);

const Dashboard = () => {
  const [storeName, setStoreName] = useState('');
  const [templateId, setTemplateId] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateStorePrompt, setShowCreateStorePrompt] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Store ID state (needed to show Store Settings button)
  const [storeId, setStoreId] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setError('Please log in to view your store');
          setLoading(false);
          return;
        }

        // If a store was selected from MyStores, use it directly
        if (location.state?.selectedStore && location.state?.skipRedirect) {
          const selectedStore = location.state.selectedStore;
          setStoreName(selectedStore.storeName || 'Your Store');
          setTemplateId(selectedStore.templateId);
          setStoreStatus(selectedStore.status);
          setStoreId(selectedStore.id);
          setError(null);
          setLoading(false);
          return;
        }

        console.log('Fetching store data...');
        const response = await apiClient.get('/stores');
        
        console.log('Store data response:', response.data);
        if (response.data && response.data.length > 0) {
          // If one or more stores and not explicitly skipping redirect, redirect to My Stores page
          // Only redirect if coming from login (has hasStore or storeCount in state), not from direct navigation
          if (!location.state?.skipRedirect && (location.state?.hasStore !== undefined || location.state?.storeCount !== undefined)) {
            navigate('/my-stores');
            return;
          }
          // Otherwise, use the first store
          const firstStore = response.data[0];
          setStoreName(firstStore.storeName || 'Your Store');
          setTemplateId(firstStore.templateId);
          setStoreStatus(firstStore.status);
          setStoreId(firstStore.id);
        } else {
          console.log('No store data found');
          setStoreName('Your Store');
          setError(null);
          
          // Show create store prompt if coming from login
          if (location.state?.hasStore === false || location.state?.storeCount === 0) {
            setShowCreateStorePrompt(true);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching store:', error);
        console.error('   Error response:', error.response?.data);
        console.error('   Error status:', error.response?.status);
        console.error('   Error message:', error.message);
        if (error.response?.data) {
          console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.response?.status === 401) {
          // Token is invalid - let axios interceptor handle the redirect
          // Don't redirect here as it might cause double redirects
          setError('Your session has expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setError('Failed to fetch store information. Please try again.');
          setStoreName('Your Store');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [location.state, navigate]);

  const handleCreateStore = () => {
    navigate('/store-templates');
  };

  const handleDismissPrompt = () => {
    setShowCreateStorePrompt(false);
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
      {/* Create Store Prompt Modal */}
      {showCreateStorePrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1f2937'
            }}>
              Welcome! 👋
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              You don't have a store yet. Would you like to create a new one?
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleDismissPrompt}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
              >
                Maybe Later
              </button>
              <button
                onClick={handleCreateStore}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                Create Store
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/80 border border-white/30 rounded-[32px] shadow-2xl backdrop-blur-3xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 drop-shadow-sm">
            {loading ? 'Loading...' : `Welcome to ${storeName}`}
          </h1>
          {error && (
            <p className="text-rose-500 mt-2 text-lg">{error}</p>
          )}
          {!error && !showCreateStorePrompt && (
            <p className="text-gray-600 mt-2 text-lg">
              Here are some tips to help you get started.
            </p>
          )}
        </div>

        <div className="grid gap-6">
        {storeId && (
          <TodoCard
            icon={
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            }
            title="Store Settings"
            description="Manage your store information and settings."
            subDescription="Update your store name, description, location, contact information, and domain settings."
            actionText="Manage Settings"
            actionLink="/dashboard/store-settings"
            variant="solid"
          />
        )}
        {console.log('🔍 Rendering dashboard cards, storeStatus:', storeStatus)}
        <TodoCard
          icon={
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          }
          title="Edit Store"
          description="Customize your store template and design."
          subDescription="Edit your store information and customize the template design, including hero content, text styling, and background settings."
          actionText={templateId ? "Edit Template" : "Set Up Your Store"}
          actionLink={templateId ? `/site-builder?template=${templateId}` : "/store-templates"}
          variant="solid"
        />
        <TodoCard
          icon={
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          }
          title="Products"
          description="Manage your products."
          subDescription="Add, edit, and manage your store products with images, pricing, and descriptions."
          actionText="Manage Products"
          actionLink="/dashboard/products"
          variant="solid"
        />
        <TodoCard
          icon={
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          }
          title="Orders"
          description="Manage customer orders."
          subDescription="View and manage orders with real-time status updates (Processing, Shipped, Completed)."
          actionText="View Orders"
          actionLink="/dashboard/orders"
          variant="solid"
        />
        <TodoCard
          icon={
            <div className="bg-teal-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          }
          title="Sales Analytics"
          description="Track your sales performance."
          subDescription="View monthly sales graphs, revenue trends, and order statistics."
          actionText="View Analytics"
          actionLink="/dashboard/analytics"
          variant="solid"
        />
        <TodoCard
          icon={
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          }
          title="Payment"
          description="Help the money roll in!"
          subDescription="Integrate with the best payment gateways to collect payments online."
          actionText="Set Up Payment"
          actionLink="/dashboard/payment"
          variant="solid"
        />
        <TodoCard
          icon={
            <div className="bg-indigo-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          }
          title="Shipping"
          description="Configure shipping rates by weight and destination."
          subDescription="Set up shipping rates based on weight and destination area. Update rates when delivery fees change."
          actionText="Configure Shipping"
          actionLink="/dashboard/shipping"
          variant="solid"
        />
        <TodoCard
          icon={
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          }
          title="Publish"
          description="Register. Set. Publish."
          subDescription="Our easy-to-follow guide will walk you through every step from domain mapping to publishing."
          actionText="Publish Site"
          actionLink="/publish"
          variant="solid"
        />
      </div>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;
  