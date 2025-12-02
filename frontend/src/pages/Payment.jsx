import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../utils/axios';

const Payment = () => {
  const [store, setStore] = useState(null);
  const [config, setConfig] = useState({
    gcashEnabled: false,
    codEnabled: false,    // Cash on Delivery toggle
    paypalEnabled: false, // Legacy field (kept for backward compatibility)
    cardEnabled: false,   // Reused as Bank Transfer toggle to avoid breaking existing saved configs
    gcashMerchantId: '',  // Legacy field (not used anymore, kept for backward compatibility)
    gcashNumber: '',      // GCash mobile number for generating QR codes
    gcashQrImage: '',     // GCash QR code image (base64) - optional, legacy support
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
              ...currentStore.content.payment,
              // Map paypalEnabled to codEnabled for backward compatibility
              codEnabled: currentStore.content.payment.codEnabled ?? currentStore.content.payment.paypalEnabled ?? false
            }));
          } else {
            // Fallback to localStorage for backward compatibility
            const savedConfig = localStorage.getItem('paymentConfig');
            if (savedConfig) {
              const parsed = JSON.parse(savedConfig);
              setConfig({
                ...parsed,
                // Map paypalEnabled to codEnabled for backward compatibility
                codEnabled: parsed.codEnabled ?? parsed.paypalEnabled ?? false
              });
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
      
      // Update content with payment settings (GCash and COD)
      const updatedContent = {
        ...currentContent,
        payment: {
          gcashEnabled: config.gcashEnabled,
          gcashNumber: config.gcashNumber,
          gcashQrImage: config.gcashQrImage, // Keep for backward compatibility
          codEnabled: config.codEnabled
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
            <div className="pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">GCash</h3>
                  <p className="text-sm text-gray-600">
                    Enable GCash payments so customers can easily scan and pay using an auto-generated QR code.
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
                      GCash Mobile Number *
                    </label>
                    <input
                      type="text"
                      value={config.gcashNumber}
                      onChange={(e) => {
                        // Remove non-digit characters except +
                        const cleaned = e.target.value.replace(/[^\d+]/g, '');
                        setConfig({ ...config, gcashNumber: cleaned });
                      }}
                      placeholder="09XX XXX XXXX or +63 XXX XXX XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      maxLength={15}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your GCash mobile number (e.g., 09123456789). QR codes will be generated automatically based on this number.
                      <br />
                      <strong>Note:</strong> This will be used to generate dynamic QR codes for products. Customers will scan the QR code and manually enter the amount.
                    </p>
                  </div>
                  <div className="border-t pt-4 text-sm text-gray-600">
                    Structura will use the GCash mobile number above to auto-generate a QR code for customers.
                  </div>
                </div>
              )}
            </div>

            {/* COD Configuration */}
            <div className="pb-6 border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Cash on Delivery (COD)</h3>
                  <p className="text-sm text-gray-600">
                    Enable Cash on Delivery payments. Customers will pay with cash when they receive their order.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.codEnabled}
                    onChange={(e) => setConfig({ ...config, codEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {config.codEnabled && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💵 Cash on Delivery</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    When COD is enabled, customers can choose to pay with cash upon delivery of their order.
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Payment will be collected when the order is delivered</p>
                    <p>• Customers will see COD as a payment option during checkout</p>
                    <p>• Make sure to prepare for cash collection during delivery</p>
                    <p>• COD orders typically have a payment status of "pending" until delivery is completed</p>
                  </div>
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
