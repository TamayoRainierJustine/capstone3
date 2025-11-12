import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import '../styles/MyStores.css';

const templateNames = {
  bladesmith: 'Struvaris',
  pottery: 'Truvara',
  balisong: 'Ructon',
  weavery: 'Urastra',
  woodcarving: 'Caturis'
};

const MyStores = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingStoreId, setDeletingStoreId] = useState(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your stores');
          setLoading(false);
          return;
        }

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          setStores(response.data);
          setError('');
        } else {
          setStores([]);
          setError('No stores found. Create your first store to get started!');
        }
      } catch (error) {
        console.error('❌ Error fetching stores:', error);
        console.error('   Error response:', error.response?.data);
        console.error('   Error status:', error.response?.status);
        console.error('   Error message:', error.message);
        if (error.response?.data) {
          console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
        }
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError('Failed to fetch stores. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleSelectStore = (store) => {
    // Store the selected store ID in localStorage for future use
    localStorage.setItem('selectedStoreId', store.id);
    // Navigate to dashboard with store context
    navigate('/dashboard', { state: { selectedStore: store, skipRedirect: true } });
  };

  const handleCreateStore = () => {
    navigate('/store-templates');
  };

  const handleDeleteStore = async (storeId, storeName) => {
    if (!window.confirm(`Are you sure you want to delete "${storeName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingStoreId(storeId);
    try {
      await apiClient.delete(`/stores/${storeId}`);
      // Remove the store from the list
      setStores(stores.filter(store => store.id !== storeId));
      setError('');
    } catch (error) {
      console.error('Error deleting store:', error);
      alert(error.response?.data?.message || 'Failed to delete store. Please try again.');
    } finally {
      setDeletingStoreId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '600',
          background: '#d1fae5',
          color: '#065f46',
          position: 'absolute',
          top: '-55px',
          right: '1.5rem',
          zIndex: 11
        }}>
          Published
        </span>
      );
    }
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: '#fef3c7',
        color: '#92400e',
        position: 'absolute',
        top: '-55px',
        right: '1.5rem',
        zIndex: 11
      }}>
        Draft
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <Header />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: 'calc(100vh - 80px)',
          fontSize: '1.125rem',
          color: '#6b7280'
        }}>
          Loading your stores...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #FF6B9D 0%, #C44569 25%, #8B5CF6 50%, #4C1D95 75%, #1E1B4B 100%)' }}>
      <Header />
      <div className="my-stores-container">
        <div className="my-stores-header">
          <h1>My Stores</h1>
          <p>Manage and access all your stores</p>
          <button 
            onClick={handleCreateStore}
            className="create-store-button"
          >
            + Create New Store
          </button>
        </div>

        {error && stores.length === 0 && (
          <div className="error-message">
            {error}
          </div>
        )}

        {stores.length > 0 && (
          <div className="stores-grid">
            {stores.map((store) => (
              <div key={store.id} className="store-card">
                {getStatusBadge(store.status || 'draft')}
                <div className="store-card-header">
                  <div>
                    <h2>{store.storeName}</h2>
                    <p className="store-domain" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Domain: {store.domainName}
                    </p>
                    {store.status === 'published' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <a
                          href={`${window.location.origin}/published/${encodeURIComponent(store.domainName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            fontSize: '0.75rem',
                            color: '#8b5cf6',
                            textDecoration: 'none',
                            fontWeight: '500',
                            marginBottom: '0.5rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔗 View Store: {window.location.origin}/published/{store.domainName}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="store-card-body">
                  <div className="store-info-item">
                    <span className="info-label">Template:</span>
                    <span className="info-value">{templateNames[store.templateId] || store.templateId}</span>
                  </div>
                  <div className="store-info-item">
                    <span className="info-label">Description:</span>
                    <span className="info-value">{store.description || 'No description'}</span>
                  </div>
                  <div className="store-info-item">
                    <span className="info-label">Location:</span>
                    <span className="info-value">
                      {store.barangay && `${store.barangay}, `}
                      {store.municipality && `${store.municipality}, `}
                      {store.province && store.province}
                    </span>
                  </div>
                  <div className="store-info-item">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">{store.contactEmail}</span>
                  </div>
                </div>

                <div className="store-card-actions">
                  {store.status === 'published' && (
                    <>
                      <a
                        href={`${window.location.origin}/published/${encodeURIComponent(store.domainName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-button"
                        style={{
                          width: '100%',
                          marginBottom: '0.5rem',
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'block'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        🌐 Visit Store
                      </a>
                    </>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteStore(store.id, store.storeName);
                    }}
                    className="delete-store-button"
                    disabled={deletingStoreId === store.id}
                    style={{
                      display: 'block',
                      visibility: 'visible',
                      opacity: deletingStoreId === store.id ? 0.6 : 1,
                      width: '100%',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: '2px solid #dc2626',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: deletingStoreId === store.id ? 'not-allowed' : 'pointer',
                      marginBottom: '0.75rem',
                      position: 'relative',
                      zIndex: 100
                    }}
                  >
                    {deletingStoreId === store.id ? '⏳ Deleting...' : '🗑️ Delete Store'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleSelectStore(store)}
                    className="action-button primary"
                    style={{ width: '100%' }}
                  >
                    Open Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStores;

