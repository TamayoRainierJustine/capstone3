import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import Header from '../components/Header';
import '../styles/StoreSetup.css';
import apiClient from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const StoreSetup = () => {
  const location = useLocation();
  const templateId = location.state?.templateId;
  const storeId = location.state?.storeId || new URLSearchParams(location.search).get('storeId');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if no template ID is provided
  useEffect(() => {
    if (!templateId && !storeId) {
      navigate('/store-templates');
    }
  }, [templateId, storeId, navigate]);
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    domainName: '',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    contactEmail: '',
    phone: '',
  });
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingStore, setExistingStore] = useState(null);

  // Only check for existing store if we're in edit mode (storeId provided)
  useEffect(() => {
    const checkExistingStore = async () => {
      // Only check if we're editing an existing store
      if (!storeId) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await apiClient.get(`/stores/${storeId}`);

        if (response.data) {
          const store = response.data;
          setExistingStore(store);
          
          // Pre-fill form with existing store data
          setFormData({
            storeName: store.storeName || '',
            description: store.description || '',
            domainName: store.domainName || '',
            region: store.region || '',
            province: store.province || '',
            municipality: store.municipality || '',
            barangay: store.barangay || '',
            contactEmail: store.contactEmail || '',
            phone: store.phone || ''
          });
          
          // Load location dropdowns based on existing data
          if (store.region) {
            setProvincesList(getProvincesByRegion(store.region));
            if (store.province) {
              setMunicipalitiesList(getCityMunByProvince(store.province));
              if (store.municipality) {
                const barangaysData = getBarangayByMun(store.municipality);
                const barangaysArray = barangaysData?.data || barangaysData || [];
                setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
                  brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
                  name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
                })) : []);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking existing store:', error);
      }
    };

    checkExistingStore();
  }, [storeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Normalize domain name: lowercase, remove spaces, remove special characters except hyphens
    let processedValue = value;
    if (name === 'domainName') {
      processedValue = value
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when user starts typing in domain name field
    if (name === 'domainName' && error) {
      setError('');
    }
    if (name === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setFormData(prev => ({ ...prev, province: '', municipality: '', barangay: '' }));
    }
    if (name === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setFormData(prev => ({ ...prev, municipality: '', barangay: '' }));
    }
    if (name === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setFormData(prev => ({ ...prev, barangay: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (!templateId) {
        setError('No template selected. Please go back and select a template.');
        setIsLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a store');
        return;
      }
      // If we're editing an existing store (storeId provided), update it
      if (existingStore && storeId) {
        const payload = {
          templateId: templateId || existingStore.templateId,
          ...formData
        };
        
        const response = await apiClient.put(`/stores/${storeId}`, payload);
        
        console.log('Store updated:', response.data);
        navigate('/my-stores');
      } else {
        // Create new store
        if (!templateId) {
          setError('No template selected. Please go back and select a template.');
          setIsLoading(false);
          return;
        }
        
        const payload = {
          templateId,
          ...formData
        };
        console.log('Sending payload:', payload);
        const response = await apiClient.post('/stores', payload);
        console.log('Response:', response.data);
        navigate('/my-stores');
      }
    } catch (error) {
      console.error('❌ Error creating/updating store:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      
      const errorData = error.response?.data;
      let errorMessage = 'An error occurred while saving your store. Please try again.';
      
      // Check for duplicate domain name error
      if (errorData?.message && errorData.message.includes('domain name already exists')) {
        errorMessage = `⚠️ The domain name "${formData.domainName}" is already taken. Please choose a different domain name.`;
      } else if (errorData?.details && (
        errorData.details.includes('duplicate key') || 
        errorData.details.includes('domainName') ||
        errorData.details.includes('Duplicate entry')
      )) {
        errorMessage = `⚠️ The domain name "${formData.domainName}" is already taken. Please choose a different domain name.`;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.details) {
        errorMessage = errorData.details;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="store-setup-page">
      <Header />
      <div className="store-setup-content">
        <div className="setup-header">
          <h1>{existingStore ? 'Update Your Store' : 'Set Up Your Store'}</h1>
          <p>{existingStore ? 'Update your store details below' : 'Fill in your store details to get started'}</p>
          {existingStore && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#dbeafe', 
              border: '1px solid #93c5fd', 
              borderRadius: '0.5rem',
              color: '#1e40af',
              fontSize: '0.875rem'
            }}>
              You already have a store. Updating it will modify your existing store information.
            </div>
          )}
        </div>
        {error && (
          <div className="error-message" style={{ 
            padding: '1rem', 
            background: '#fee2e2', 
            border: '1px solid #fca5a5', 
            borderRadius: '0.5rem',
            color: '#dc2626',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="storeName">Store Name</label>
            <input
              type="text"
              id="storeName"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              required
              placeholder="Enter your store name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Store Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your store and what you offer"
            />
          </div>
          <div className="form-group">
            <label htmlFor="domainName">Desired Domain Name</label>
            <div className="domain-input-container">
              <input
                type="text"
                id="domainName"
                name="domainName"
                value={formData.domainName}
                onChange={handleChange}
                required
                placeholder="Enter your domain name (e.g., my-store)"
                style={{ width: '70%' }}
                pattern="[a-z0-9-]+"
                title="Domain name can only contain lowercase letters, numbers, and hyphens"
              />
              <span className="domain-suffix" style={{ color: '#6b7280' }}> (your unique identifier)</span>
            </div>
            <small style={{ 
              display: 'block', 
              marginTop: '0.25rem', 
              color: '#6b7280', 
              fontSize: '0.75rem' 
            }}>
              Your store will be accessible at: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>
                {window.location.origin}/published/[your-domain-name]
              </code>
            </small>
            <small style={{ 
              display: 'block', 
              marginTop: '0.25rem', 
              color: '#6b7280', 
              fontSize: '0.75rem' 
            }}>
              Domain names are automatically converted to lowercase. Only letters, numbers, and hyphens are allowed.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="region">Region</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              <option value="">Select Region</option>
              {regionsList.map(region => (
                <option key={region.reg_code} value={region.reg_code}>{region.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="province">Province</label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              disabled={!provincesList.length}
            >
              <option value="">Select Province</option>
              {provincesList.map(province => (
                <option key={province.prov_code} value={province.prov_code}>{province.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="municipality">Municipality/City</label>
            <select
              id="municipality"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              required
              disabled={!municipalitiesList.length}
            >
              <option value="">Select Municipality/City</option>
              {municipalitiesList.map(mun => (
                <option key={mun.mun_code} value={mun.mun_code}>{mun.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="barangay">Barangay</label>
            <select
              id="barangay"
              name="barangay"
              value={formData.barangay}
              onChange={handleChange}
              required
              disabled={!barangaysList.length}
            >
              <option value="">Select Barangay</option>
              {barangaysList.map((brgy, idx) => (
                <option
                  key={brgy.brgy_code || brgy.code || brgy.brgyName || brgy.name || idx}
                  value={brgy.name}
                >
                  {brgy.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              placeholder="Enter your contact email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Saving...' : existingStore ? 'Update Store Details' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoreSetup;