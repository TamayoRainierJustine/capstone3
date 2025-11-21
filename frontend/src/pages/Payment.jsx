import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import apiClient from '../utils/axios';

const Payment = () => {
  const [store, setStore] = useState(null);
  const [config, setConfig] = useState({
    gcashEnabled: false,
    codEnabled: false,    // Cash on Delivery toggle
    paypalEnabled: false, // Legacy field (kept for backward compatibility)
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
          gcashQrImage: config.gcashQrImage,
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
            <div className="pb-6">
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
                        
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          setMessage('Please upload an image file (PNG, JPG, etc.)');
                          return;
                        }
                        
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          setMessage('Image file is too large. Maximum size is 5MB.');
                          return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result;
                          if (typeof result === 'string') {
                            // Verify the image loaded correctly
                            const img = new Image();
                            img.onload = () => {
                              // Check minimum dimensions (QR codes should be at least 200x200)
                              if (img.width < 200 || img.height < 200) {
                                setMessage('QR code image is too small. Please use an image that is at least 200x200 pixels.');
                                return;
                              }
                              setConfig((prev) => ({ ...prev, gcashQrImage: result }));
                              setMessage('');
                            };
                            img.onerror = () => {
                              setMessage('Invalid image file. Please try again with a valid PNG or JPG image.');
                            };
                            img.src = result;
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="w-full text-sm text-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload the GCash QR code you want your customers to scan when they choose GCash.
                      <br />
                      <strong>Tips for a valid QR code:</strong>
                      <br />
                      • Use high-resolution image (at least 500x500px recommended)
                      <br />
                      • Ensure the QR code has white padding/margin around it
                      <br />
                      • Use PNG format for best quality (or high-quality JPG)
                      <br />
                      • Make sure the QR code is clear and not blurry
                    </p>
                  </div>
                  {config.gcashQrImage && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                      <div className="inline-block border rounded-lg p-3 bg-white">
                        <img
                          src={config.gcashQrImage}
                          alt="GCash QR Code Preview"
                          style={{ 
                            width: '250px', 
                            height: '250px', 
                            minWidth: '250px',
                            minHeight: '250px',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                          onError={(e) => {
                            console.error('Error loading QR code preview');
                            e.target.style.display = 'none';
                          }}
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
                    checked={config.codEnabled ?? false}
                    onChange={(e) => setConfig({ ...config, codEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              {(config.codEnabled ?? false) && (
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
