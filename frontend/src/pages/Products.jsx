import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
import { QRCodeSVG } from 'qrcode.react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [store, setStore] = useState(null);
  const [hasQrApi, setHasQrApi] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get('/stores');
      if (response.data && response.data.length > 0) {
        const storeData = response.data[0];
        setStore(storeData);
        
        // Check QR API status for this store
        if (storeData.id) {
          try {
            const qrStatusResponse = await apiClient.get(`/api-applications/stores/${storeData.id}/qr-api-status`);
            setHasQrApi(qrStatusResponse.data?.hasQrApi || false);
          } catch (error) {
            console.error('Error checking QR API status:', error);
            setHasQrApi(false);
          }
        }
        
        // Parse payment config from store content
        if (storeData.content?.payment) {
          // Store GCash number is available in storeData.content.payment.gcashNumber
        }
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    }
  };

  useEffect(() => {
    if (selectedCategory === '') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [products, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const response = await apiClient.get('/products/categories/list');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Refresh products when page becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts();
      }
    };

    const handleFocus = () => {
      fetchProducts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiClient.get('/products');

      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to delete products');
        navigate('/login');
        return;
      }

      await apiClient.delete(`/products/${id}`);

      // Remove product from list
      setProducts(products.filter(p => p.id !== id));
      
      // Show success message
      alert('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete product. Please try again.';
      alert(errorMessage);
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to update products');
        navigate('/login');
        return;
      }

      const newActiveStatus = !product.isActive;
      
      await apiClient.put(`/products/${product.id}`, {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        isActive: newActiveStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Update product in list
      setProducts(products.map(p => p.id === product.id ? { ...p, isActive: newActiveStatus } : p));
      
      // Show success message
      alert(`Product ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update product. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex max-w-7xl mx-auto px-4 py-8 gap-6">
        {/* Sidebar with Category Filter */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Products</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Product Count</p>
              <p className="text-lg font-semibold text-purple-600">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your store products</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              title="Refresh products"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/addproducts')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              + Add Product
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            {products.length === 0 ? (
              <>
                <p className="text-gray-600 mb-4">No products yet</p>
                <button
                  onClick={() => navigate('/dashboard/addproducts')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Your First Product
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">No products found in this category</p>
                <button
                  onClick={() => setSelectedCategory('')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Show All Products
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  {product.image ? (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                      product.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                  {product.category && (
                    <span className="inline-block px-2 py-1 mb-2 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                      {product.category}
                    </span>
                  )}
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-purple-600">₱{parseFloat(product.price).toFixed(2)}</span>
                    <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                  </div>
                  <div className="flex space-x-2 flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                      className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm min-w-[60px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm min-w-[80px]"
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowQRModal(true);
                      }}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                      title="Generate QR Code"
                      disabled={!store?.domainName || store?.status !== 'published'}
                    >
                      QR Code
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedProduct && store && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Product QR Code</h2>
              <button
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            {store.status === 'published' && store.domainName ? (
              !hasQrApi ? (
                <div className="text-center py-4">
                  <div className="mb-3">
                    <svg className="mx-auto h-12 w-12 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-semibold mb-2">QR Code Generation Not Available</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Your store needs to have an approved QR API application to generate QR codes.
                    Please apply for QR API access in the Dashboard.
                  </p>
                  <button
                    onClick={() => {
                      setShowQRModal(false);
                      setSelectedProduct(null);
                      navigate('/dashboard');
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">{selectedProduct.name}</p>
                    <p className="text-lg font-semibold text-purple-600">₱{parseFloat(selectedProduct.price).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-center mb-4 p-4 bg-white border-2 border-gray-200 rounded-lg">
                    {(() => {
                      const gcashNumber = store.content?.payment?.gcashNumber || '';
                      const productUrl = `${window.location.origin}/published/${encodeURIComponent(store.domainName)}?product=${selectedProduct.id}&addToCart=true`;
                      const productPrice = parseFloat(selectedProduct.price).toFixed(2);
                      
                      // Generate QR code value: Product URL (for store link) + GCash payment info
                      // Format: URL with GCash info as query params
                      const qrValue = gcashNumber 
                        ? `${productUrl}&gcash=${encodeURIComponent(gcashNumber)}&amount=${productPrice}`
                        : productUrl;
                      
                      return (
                        <QRCodeSVG
                          value={qrValue}
                          size={256}
                          level="H"
                          includeMargin={true}
                        />
                      );
                    })()}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Scan this QR code to:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                      <li>Open product in your published store</li>
                      <li>Automatically add to cart</li>
                      <li>Checkout using GCash</li>
                    </ul>
                    {store.content?.payment?.gcashNumber ? (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-medium text-blue-800 mb-1">GCash Payment Info:</p>
                        <p className="text-xs text-blue-700">Number: {store.content.payment.gcashNumber}</p>
                        <p className="text-xs text-blue-700">Amount: ₱{parseFloat(selectedProduct.price).toFixed(2)}</p>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ GCash number not set. Please set it in Payment Settings.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const qrUrl = `${window.location.origin}/published/${encodeURIComponent(store.domainName)}?product=${selectedProduct.id}&addToCart=true`;
                        navigator.clipboard.writeText(qrUrl);
                        alert('QR Code URL copied to clipboard!');
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        setShowQRModal(false);
                        setSelectedProduct(null);
                      }}
                      className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </>
              )
            ) : (
              <div className="text-center py-4">
                <p className="text-red-600 mb-2">Store not published yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Please publish your store first to generate QR codes.
                </p>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    setSelectedProduct(null);
                    navigate('/publish');
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Go to Publish Page
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;

