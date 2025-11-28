import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import '../styles/AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: null,
    model3d: null,
    stock: '',
    weight: '',
    category: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/products/categories/list');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or WebP)');
        return;
      }

      setError('');
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModel3dChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 20MB for 3D models)
      if (file.size > 20 * 1024 * 1024) {
        setError('3D model size should be less than 20MB');
        return;
      }
      
      // Validate file type (GLB/GLTF)
      const fileName = file.name.toLowerCase();
      const isValid3dFile = fileName.endsWith('.glb') || fileName.endsWith('.gltf');
      
      if (!isValid3dFile) {
        setError('Please upload a valid 3D model file (GLB or GLTF format)');
        return;
      }

      setError('');
      setFormData(prev => ({
        ...prev,
        model3d: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add products');
        setIsLoading(false);
        return;
      }

      // Create FormData for file upload
      const productData = new FormData();
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('stock', formData.stock || 0);
      productData.append('weight', formData.weight || 0);
      if (formData.category) {
        productData.append('category', formData.category);
      }
      if (formData.image) {
        productData.append('image', formData.image);
      }
      if (formData.model3d) {
        productData.append('model3d', formData.model3d);
      }

      const response = await apiClient.post('/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Navigate to products page or dashboard
      navigate('/dashboard/products');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to add product. Please try again.';
      setError(errorMessage);
      console.error('Error adding product:', err);
      console.error('Error response:', err.response?.data);
      setIsLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <Header />
      <div className="add-product-content">
        <div className="product-header">
          <h1>Add New Product</h1>
          <p>Fill in the details to add a new product to your store</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Product Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter product name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your product"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₱)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="stock">Stock</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="e.g. 0.5"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setShowNewCategory(true);
                    setFormData(prev => ({ ...prev, category: '' }));
                  } else {
                    setShowNewCategory(false);
                    setFormData(prev => ({ ...prev, category: e.target.value }));
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select a category (optional)</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="new">+ Add New Category</option>
              </select>
              {showNewCategory && (
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Enter new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newCategory.trim()) {
                          setFormData(prev => ({ ...prev, category: newCategory.trim() }));
                          setCategories(prev => {
                            const updated = [...prev, newCategory.trim()];
                            return [...new Set(updated)].sort();
                          });
                          setNewCategory('');
                          setShowNewCategory(false);
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategory.trim()) {
                        setFormData(prev => ({ ...prev, category: newCategory.trim() }));
                        setCategories(prev => {
                          const updated = [...prev, newCategory.trim()];
                          return [...new Set(updated)].sort();
                        });
                        setNewCategory('');
                        setShowNewCategory(false);
                      }
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#8B5CF6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategory(false);
                      setNewCategory('');
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">Product Image</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/webp"
                required
                className="file-input"
              />
              <label htmlFor="image" className="file-label">
                Choose File
              </label>
              <span className="file-name">
                {formData.image ? formData.image.name : 'No file chosen'}
              </span>
            </div>
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="model3d">3D Model (Optional)</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="model3d"
                name="model3d"
                onChange={handleModel3dChange}
                accept=".glb,.gltf"
                className="file-input"
              />
              <label htmlFor="model3d" className="file-label">
                Choose 3D Model File
              </label>
              <span className="file-name">
                {formData.model3d ? formData.model3d.name : 'No file chosen (GLB or GLTF format)'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
              Upload a 3D model file (GLB or GLTF format, max 20MB) to enable 3D viewer for customers
            </p>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Adding Product...' : 'Add Product'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="cancel-button" disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct; 