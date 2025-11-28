import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';

const Shipping = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Weight bands configuration
  const weightBands = ['0-0.5', '0.5-1', '1-3', '5-6'];
  const destinationAreas = ['Metro Manila', 'Luzon', 'Visayas', 'Mindanao', 'Island'];

  // Default shipping rates (fallback)
  const defaultRates = {
    '0-0.5': {
      'Metro Manila': 100,
      'Luzon': 100,
      'Visayas': 85,
      'Mindanao': 105,
      'Island': 115
    },
    '0.5-1': {
      'Metro Manila': 180,
      'Luzon': 180,
      'Visayas': 155,
      'Mindanao': 175,
      'Island': 185
    },
    '1-3': {
      'Metro Manila': 200,
      'Luzon': 200,
      'Visayas': 180,
      'Mindanao': 200,
      'Island': 210
    },
    '5-6': {
      'Metro Manila': 500,
      'Luzon': 500,
      'Visayas': 455,
      'Mindanao': 475,
      'Island': 485
    }
  };

  // Shipping rates state
  const [shippingRates, setShippingRates] = useState(() => {
    const rates = {};
    weightBands.forEach(band => {
      rates[band] = {};
      destinationAreas.forEach(area => {
        rates[band][area] = defaultRates[band]?.[area] || 0;
      });
    });
    return rates;
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Error: Please log in to view shipping settings');
        return;
      }

      const response = await apiClient.get('/stores');
      if (response.data && response.data.length > 0) {
        const storeData = response.data[0];
        setStore(storeData);

        // Load existing shipping rates from store content
        if (storeData.content?.shippingRates) {
          const existingRates = storeData.content.shippingRates;
          setShippingRates(prev => {
            const updated = { ...prev };
            weightBands.forEach(band => {
              if (existingRates[band]) {
                updated[band] = { ...prev[band], ...existingRates[band] };
              }
            });
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
      setMessage('Failed to load store information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRateChange = (weightBand, destinationArea, value) => {
    const numValue = parseFloat(value) || 0;
    setShippingRates(prev => ({
      ...prev,
      [weightBand]: {
        ...prev[weightBand],
        [destinationArea]: numValue
      }
    }));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all shipping rates to default values?')) {
      setShippingRates(defaultRates);
      setMessage('Shipping rates reset to default values. Click Save to apply changes.');
    }
  };

  const handleSave = async () => {
    if (!store) {
      setMessage('Error: No store found');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Get current store content
      const currentContent = store.content || {};

      // Update content with shipping rates only
      const updatedContent = {
        ...currentContent,
        shippingRates: shippingRates
      };

      // Log shipping rates before saving
      console.log('💾 Saving shipping rates:', shippingRates);
      console.log('💾 Updated content:', updatedContent);
      
      // Save to backend via store content API
      const response = await apiClient.put(`/stores/${store.id}/content`, {
        content: updatedContent
      });

      console.log('✅ Store content saved:', response.data);

      // Update local store state
      setStore(prev => ({
        ...prev,
        content: updatedContent
      }));

      setMessage('Shipping rates saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving shipping rates:', error);
      setMessage('Failed to save shipping rates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Shipping Configuration</h1>
          <p className="text-gray-600 mb-6">
            Configure shipping rates based on weight and destination. Update these rates when delivery riders increase their fees.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Shipping Rates Section */}
          <div>
            <div className="space-y-6">
              {/* Fixed Rates Table */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Shipping Rates by Weight and Destination</h2>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset to Default
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Set shipping rates (in PHP) for each weight band and destination area. Update these when delivery riders increase their fees.
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">
                          Weight Band (kg)
                        </th>
                        {destinationAreas.map(area => (
                          <th
                            key={area}
                            className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b"
                          >
                            {area}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weightBands.map((band, bandIndex) => (
                        <tr key={band} className={bandIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                            {band}
                          </td>
                          {destinationAreas.map(area => (
                            <td key={area} className="px-4 py-3 border-b">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">₱</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={shippingRates[band]?.[area] || 0}
                                  onChange={(e) => handleRateChange(band, area, e.target.value)}
                                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Shipping Rates'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipping;
