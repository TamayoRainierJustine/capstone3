import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import Header from '../components/Header';
import '../styles/StoreSetup.css';

const Settings = () => {
  const navigate = useNavigate();
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
  const [success, setSuccess] = useState('');
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    // Fetch current store info
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your store settings');
          return;
        }

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          const store = response.data[0];
          setFormData({
            storeName: store.storeName || '',
            description: store.description || '',
            domainName: store.domainName || '',
            region: store.region || '',
            province: store.province || '',
            municipality: store.municipality || '',
            barangay: store.barangay || '',
            contactEmail: store.contactEmail || '',
            phone: store.phone || '',
          });
          if (store.region) setProvincesList(getProvincesByRegion(store.region));
          if (store.province) setMunicipalitiesList(getCityMunByProvince(store.province));
          if (store.municipality) {
            const barangaysData = getBarangayByMun(store.municipality);
            const barangaysArray = barangaysData?.data || barangaysData || [];
            setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
              brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
              name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
            })) : []);
          }
          setHasStore(true);
        } else {
          setHasStore(false);
        }
      } catch (err) {
        console.error('Error fetching store:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError('Failed to fetch store info. Please try again.');
        }
      }
    };
    fetchStore();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setSuccess('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to update your store');
        return;
      }

      const response = await apiClient.get('/stores', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No store found');
      }

      const storeId = response.data[0].id;
      await apiClient.put(`/stores/${storeId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSuccess('Store information updated successfully!');
    } catch (err) {
      console.error('Error updating store:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        setError('Failed to update store information. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="store-setup-page">
      <Header />
      <div className="store-setup-content">
        <div className="setup-header">
          <h1>Edit Store Information</h1>
          <p>Update your store's basic information below.</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {!hasStore ? (
          <div className="no-store-message">
            <p>You haven't created a store yet. Create one to get started!</p>
            <button onClick={() => navigate('/create-store')} className="create-store-button">Create Store</button>
          </div>
        ) : (
          <form className="setup-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="storeName">Store Name</label>
              <input type="text" id="storeName" name="storeName" value={formData.storeName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="description">Store Description</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="domainName">Desired Domain Name</label>
              <input type="text" id="domainName" name="domainName" value={formData.domainName} onChange={handleChange}  required />
            </div>
            <div className="form-group">
              <label htmlFor="region">Region</label>
              <select id="region" name="region" value={formData.region} onChange={handleChange} required>
                <option value="">Select Region</option>
                {regionsList.map(region => (
                  <option key={region.reg_code} value={region.reg_code}>{region.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="province">Province</label>
              <select id="province" name="province" value={formData.province} onChange={handleChange} required disabled={!provincesList.length}>
                <option value="">Select Province</option>
                {provincesList.map(province => (
                  <option key={province.prov_code} value={province.prov_code}>{province.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="municipality">Municipality/City</label>
              <select id="municipality" name="municipality" value={formData.municipality} onChange={handleChange} required disabled={!municipalitiesList.length}>
                <option value="">Select Municipality/City</option>
                {municipalitiesList.map(mun => (
                  <option key={mun.mun_code} value={mun.mun_code}>{mun.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="barangay">Barangay</label>
              <select id="barangay" name="barangay" value={formData.barangay} onChange={handleChange} required disabled={!barangaysList.length}>
                <option value="">Select Barangay</option>
                {barangaysList.map(brgy => (
                  <option key={brgy.brgy_code} value={brgy.brgy_code}>{brgy.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input type="email" id="contactEmail" name="contactEmail" value={formData.contactEmail} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-button" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" className="cancel-button" onClick={() => navigate('/dashboard')}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings; 