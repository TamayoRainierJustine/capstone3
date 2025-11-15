// src/pages/StoreSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';

const StoreSettings = () => {
  const navigate = useNavigate();

  // Store Settings state
  const [storeId, setStoreId] = useState(null);
  const [templateId, setTemplateId] = useState(null);
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    description: '',
    domainName: '',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    contactEmail: '',
    phone: ''
  });
  const [storeSettingsStatus, setStoreSettingsStatus] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Location dropdowns state
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setStoreSettingsStatus('Error: Please log in to view store settings');
          setLoading(false);
          return;
        }

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          const firstStore = response.data[0];
          setStoreId(firstStore.id);
          setTemplateId(firstStore.templateId);
          
          // Load store settings
          setStoreSettings({
            storeName: firstStore.storeName || '',
            description: firstStore.description || '',
            domainName: firstStore.domainName || '',
            region: firstStore.region || '',
            province: firstStore.province || '',
            municipality: firstStore.municipality || '',
            barangay: firstStore.barangay || '',
            contactEmail: firstStore.contactEmail || '',
            phone: firstStore.phone || ''
          });
          
          // Load location dropdowns based on existing data
          if (firstStore.region) {
            setProvincesList(getProvincesByRegion(firstStore.region));
            if (firstStore.province) {
              setMunicipalitiesList(getCityMunByProvince(firstStore.province));
              if (firstStore.municipality) {
                const barangaysData = getBarangayByMun(firstStore.municipality);
                const barangaysArray = barangaysData?.data || barangaysData || [];
                setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
                  brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
                  name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
                })) : []);
              }
            }
          }
        } else {
          setStoreSettingsStatus('Error: No store found. Please create a store first.');
        }
      } catch (error) {
        console.error('❌ Error fetching store data:', error);
        setStoreSettingsStatus('Error: Failed to load store settings');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  const handleStoreSettingsChange = (field, value) => {
    // Handle location cascading dropdowns
    if (field === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setStoreSettings(prev => ({ ...prev, [field]: value, province: '', municipality: '', barangay: '' }));
    } else if (field === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setStoreSettings(prev => ({ ...prev, [field]: value, municipality: '', barangay: '' }));
    } else if (field === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setStoreSettings(prev => ({ ...prev, [field]: value, barangay: '' }));
    } else {
      setStoreSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveStoreSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStoreSettingsStatus('Error: Please log in to save settings');
        return;
      }

      if (!storeId) {
        setStoreSettingsStatus('Error: No store found. Please create a store first.');
        return;
      }

      // Normalize domain name
      let normalizedDomain = storeSettings.domainName;
      if (normalizedDomain) {
        normalizedDomain = normalizedDomain
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        if (normalizedDomain.length === 0) {
          normalizedDomain = undefined;
        }
      }

      const payload = {
        templateId,
        ...storeSettings,
        domainName: normalizedDomain
      };

      await apiClient.put(`/stores/${storeId}`, payload);

      setStoreSettingsStatus('Store settings saved successfully!');
      setTimeout(() => {
        setStoreSettingsStatus('');
        navigate('/dashboard');
      }, 2000);
    } catch (e) {
      setStoreSettingsStatus('Error saving store settings: ' + (e.response?.data?.message || e.message));
      setTimeout(() => setStoreSettingsStatus(''), 5000);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: 'calc(100vh - 80px)',
        width: '100%',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p style={{ color: 'white', fontSize: '1.125rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 80px)',
      width: '100%',
      padding: '2rem',
      margin: 0
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        background: 'white', 
        borderRadius: '0.75rem', 
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>
            Store Settings
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Manage your store information and settings
          </p>
        </div>
        
        {!storeId ? (
          <div style={{ 
            padding: '2rem', 
            background: '#fee2e2', 
            borderRadius: '0.5rem',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            <p>No store found. Please create a store first.</p>
            <button
              onClick={() => navigate('/store-templates')}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Store
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Store Name
                </label>
                <input
                  type="text"
                  value={storeSettings.storeName}
                  onChange={(e) => handleStoreSettingsChange('storeName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Domain Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={storeSettings.domainName}
                    onChange={(e) => handleStoreSettingsChange('domainName', e.target.value)}
                    style={{
                      width: '70%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>.structura.com</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={storeSettings.description}
                onChange={(e) => handleStoreSettingsChange('description', e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Region
                </label>
                <select
                  value={storeSettings.region}
                  onChange={(e) => handleStoreSettingsChange('region', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select Region</option>
                  {regionsList.map(region => (
                    <option key={region.reg_code} value={region.reg_code}>{region.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Province
                </label>
                <select
                  value={storeSettings.province}
                  onChange={(e) => handleStoreSettingsChange('province', e.target.value)}
                  disabled={!provincesList.length}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: provincesList.length ? 'white' : '#f3f4f6'
                  }}
                >
                  <option value="">Select Province</option>
                  {provincesList.map(province => (
                    <option key={province.prov_code} value={province.prov_code}>{province.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Municipality/City
                </label>
                <select
                  value={storeSettings.municipality}
                  onChange={(e) => handleStoreSettingsChange('municipality', e.target.value)}
                  disabled={!municipalitiesList.length}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: municipalitiesList.length ? 'white' : '#f3f4f6'
                  }}
                >
                  <option value="">Select Municipality/City</option>
                  {municipalitiesList.map(mun => (
                    <option key={mun.mun_code} value={mun.mun_code}>{mun.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Barangay
                </label>
                <select
                  value={storeSettings.barangay}
                  onChange={(e) => handleStoreSettingsChange('barangay', e.target.value)}
                  disabled={!barangaysList.length}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    background: barangaysList.length ? 'white' : '#f3f4f6'
                  }}
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={storeSettings.contactEmail}
                  onChange={(e) => handleStoreSettingsChange('contactEmail', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={storeSettings.phone}
                  onChange={(e) => handleStoreSettingsChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleSaveStoreSettings}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              >
                Save Store Settings
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>

            {storeSettingsStatus && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: storeSettingsStatus.includes('Error') ? '#fee2e2' : '#d1fae5',
                color: storeSettingsStatus.includes('Error') ? '#dc2626' : '#065f46',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                {storeSettingsStatus}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreSettings;

