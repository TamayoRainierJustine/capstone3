import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import apiClient from '../utils/axios';

const Payment = () => {
  const [store, setStore] = useState(null);
  const [config, setConfig] = useState({
    gcashEnabled: false,
    paypalEnabled: false, // Reused as COD toggle to avoid breaking existing saved configs
    cardEnabled: false,   // Reused as Bank Transfer toggle to avoid breaking existing saved configs
    gcashMerchantId: '',  // Legacy field (not used anymore, kept for backward compatibility)
    gcashQrImage: '',     // GCash QR code image (base64)
    paypalClientId: '',   // Legacy field (not used anymore)
    stripePublishableKey: '', // Legacy field (not used anymore)
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await apiClient.get('/stores');
        if (response.data && response.data.length > 0) {
          const currentStore = response.data[0];
          setStore(currentStore);
          
          // Load payment config from store content if available
          if (currentStore.content?.payment) {
            setConfig(prev => ({
              ...prev,
              ...currentStore.content.payment
            }));
          } else {
            // Fallback to localStorage for backward compatibility
            const savedConfig = localStorage.getItem('paymentConfig');
            if (savedConfig) {
              setConfig(JSON.parse(savedConfig));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        // Fallback to localStorage
        const savedConfig = localStorage.getItem('paymentConfig');
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      }
    };

    fetchStore();
  }, []);

  const handleSave = async () => {
    if (!store) {
      setMessage('No store found. Please create a store first.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Get current store content
      const currentContent = store.content || {};
      
      // Update content with payment settings
      const updatedContent = {
        ...currentContent,
        payment: {
          gcashEnabled: config.gcashEnabled,
          paypalEnabled: config.paypalEnabled,
          cardEnabled: config.cardEnabled,
          gcashQrImage: config.gcashQrImage,
          bankName: config.bankName,
          bankAccountName: config.bankAccountName,
          bankAccountNumber: config.bankAccountNumber
        }
      };

      // Save to backend via store content API
      await apiClient.put(`/stores/${store.id}/content`, {
        content: updatedContent
      });

      // Also save to localStorage for backward compatibility
      localStorage.setItem('paymentConfig', JSON.stringify(config));
      
      setMessage('Payment settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving payment settings:', error);
      setMessage('Failed to save payment settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
          <p className="text-gray-600 mb-8">
            Configure payment gateways for your store
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* GCash Configuration */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">GCash</h3>
                  <p className="text-sm text-gray-600">
                    Enable GCash payments and upload your QR code so customers can easily scan and pay.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.gcashEnabled}
                    onChange={(e) => setConfig({ ...config, gcashEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.gcashEnabled && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GCash QR Code Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result;
                          if (typeof result === 'string') {
                            setConfig((prev) => ({ ...prev, gcashQrImage: result }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-sm text-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload the GCash QR code you want your customers to scan when they choose GCash.
                    </p>
                  </div>
                  {config.gcashQrImage && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                      <div className="inline-block border rounded-lg p-2 bg-gray-50">
                        <img
                          src={config.gcashQrImage}
                          alt="GCash QR Code"
                          className="max-h-48 w-auto object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, gcashQrImage: '' }))}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Remove QR Code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cash On Delivery (reusing PayPal toggle) */}
            <div className="border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Cash On Delivery (COD)</h3>
                  <p className="text-sm text-gray-600">
                    Allow customers to pay with cash when their orders are delivered.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.paypalEnabled}
                    onChange={(e) => setConfig({ ...config, paypalEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.paypalEnabled && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    No additional setup required. Couriers will collect payment in cash upon delivery.
                  </p>
                </div>
              )}
            </div>

            {/* Bank Transfer Configuration (reusing cardEnabled) */}
            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Bank Transfer / Bank Deposit</h3>
                  <p className="text-sm text-gray-600">
                    Allow customers to pay via bank transfer or bank deposit using your bank account details.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.cardEnabled}
                    onChange={(e) => setConfig({ ...config, cardEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.cardEnabled && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={config.bankName}
                      onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                      placeholder="e.g. BDO, BPI, Metrobank"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={config.bankAccountName}
                      onChange={(e) => setConfig({ ...config, bankAccountName: e.target.value })}
                      placeholder="Name on the bank account"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={config.bankAccountNumber}
                      onChange={(e) => setConfig({ ...config, bankAccountNumber: e.target.value })}
                      placeholder="Enter your bank account number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    These details will be used when coordinating bank transfer payments with your customers.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
