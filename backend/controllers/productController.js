import Product from '../models/product.js';
import Store from '../models/store.js';
import { Op } from 'sequelize';
import path from 'path';
import { uploadToSupabase, deleteFromSupabase } from '../utils/supabaseStorage.js';

// Get all products for a store
export const getProducts = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user's store with timeout
    const store = await Promise.race([
      Store.findOne({ 
        where: { userId },
        attributes: ['id'],
        limit: 1
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 10000)
      )
    ]);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Fetch products with timeout and limit
    const products = await Promise.race([
      Product.findAll({
        where: { storeId: store.id },
        attributes: ['id', 'storeId', 'name', 'description', 'price', 'stock', 
                     'image', 'category', 'weight', 'isActive', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']],
        limit: 1000 // Limit to prevent large queries
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 15000)
      )
    ]);

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Slow query: getProducts took ${duration}ms`);
    }

    res.json(products);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error fetching products (${duration}ms):`, error.message);
    
    // Handle timeout specifically
    if (error.message === 'Query timeout' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - database query took too long',
        error: 'TIMEOUT'
      });
    }
    
    res.status(500).json({ 
      message: error.message || 'Error fetching products',
      error: error.name || 'UNKNOWN_ERROR'
    });
  }
};

// Get a single product
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({
      where: { id, storeId: store.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get store with timeout
    const store = await Promise.race([
      Store.findOne({ 
        where: { userId },
        attributes: ['id']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (!store) {
      return res.status(404).json({ 
        message: 'Store not found. Please create a store first before adding products.' 
      });
    }

    const { name, description, price, stock, isActive, weight, category } = req.body;
    
    // Validate required fields
    if (!name || !description || !price) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, and price are required' 
      });
    }

    let imagePath = null;
    let model3dPath = null;

    // Handle image file upload to Supabase Storage with timeout
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        const file = req.files.image[0];
        const fileExtension = path.extname(file.originalname);
        const fileName = `product_${Date.now()}${fileExtension}`;
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            file.buffer,
            'products',
            fileName,
            file.mimetype
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File upload timeout')), 15000)
          )
        ]);
        
        imagePath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading image:', fileError.message);
        if (fileError.message && (fileError.message.includes('timeout') || fileError.message.includes('acquire'))) {
          return res.status(503).json({ 
            message: 'Upload timeout - please try again. The connection is being established.', 
            error: fileError.message,
            retry: true
          });
        }
        return res.status(500).json({ 
          message: 'Error uploading product image', 
          error: fileError.message 
        });
      }
    }

    // Handle 3D model file upload to Supabase Storage with timeout
    if (req.files && req.files.model3d && req.files.model3d[0]) {
      try {
        const file = req.files.model3d[0];
        const fileExtension = path.extname(file.originalname);
        const fileName = `product_3d_${Date.now()}${fileExtension}`;
        
        // Determine MIME type for 3D models
        let mimeType = file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
          if (fileExtension.toLowerCase() === '.glb') {
            mimeType = 'model/gltf-binary';
          } else if (fileExtension.toLowerCase() === '.gltf') {
            mimeType = 'model/gltf+json';
          }
        }
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            file.buffer,
            'products',
            fileName,
            mimeType
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('3D model upload timeout')), 30000)
          )
        ]);
        
        model3dPath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading 3D model:', fileError.message);
        if (fileError.message && (fileError.message.includes('timeout') || fileError.message.includes('acquire'))) {
          return res.status(503).json({ 
            message: '3D model upload timeout - please try again.', 
            error: fileError.message,
            retry: true
          });
        }
        return res.status(500).json({ 
          message: 'Error uploading 3D model', 
          error: fileError.message 
        });
      }
    }

    // Create product with timeout
    const product = await Promise.race([
      Product.create({
        storeId: store.id,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        weight: weight !== undefined && weight !== null && weight !== '' ? parseFloat(weight) : 0,
        image: imagePath,
        model3dUrl: model3dPath,
        category: category || null,
        isActive: isActive !== undefined ? isActive : true
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Product creation timeout')), 8000)
      )
    ]);

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Slow product creation: took ${duration}ms`);
    }

    res.status(201).json(product);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error creating product (${duration}ms):`, error.message);
    
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - please try again',
        error: 'TIMEOUT'
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating product', 
      error: error.message
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get store with timeout
    const store = await Promise.race([
      Store.findOne({ 
        where: { userId },
        attributes: ['id']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get product with timeout
    const product = await Promise.race([
      Product.findOne({
        where: { id, storeId: store.id }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, stock, isActive, weight, category } = req.body;
    let imagePath = product.image;
    let model3dPath = product.model3dUrl;

    // Handle image file upload if new image provided (with timeout)
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        // Delete old image from Supabase Storage if exists (non-blocking)
        if (product.image && (product.image.startsWith('products/') || product.image.startsWith('backgrounds/'))) {
          deleteFromSupabase('products', product.image).catch(err => {
            console.warn('Error deleting old image:', err.message);
          });
        }

        // Upload new image to Supabase Storage with timeout
        const file = req.files.image[0];
        const fileExtension = path.extname(file.originalname);
        const fileName = `product_${Date.now()}${fileExtension}`;
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            file.buffer,
            'products',
            fileName,
            file.mimetype
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File upload timeout')), 15000)
          )
        ]);
        
        imagePath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading image:', fileError.message);
        return res.status(500).json({ 
          message: 'Error uploading product image', 
          error: fileError.message 
        });
      }
    }

    // Handle 3D model file upload if new model provided (with timeout)
    if (req.files && req.files.model3d && req.files.model3d[0]) {
      try {
        // Delete old 3D model from Supabase Storage if exists (non-blocking)
        if (product.model3dUrl && product.model3dUrl.startsWith('products/')) {
          deleteFromSupabase('products', product.model3dUrl).catch(err => {
            console.warn('Error deleting old 3D model:', err.message);
          });
        }

        // Upload new 3D model to Supabase Storage with timeout
        const file = req.files.model3d[0];
        const fileExtension = path.extname(file.originalname);
        const fileName = `product_3d_${Date.now()}${fileExtension}`;
        
        // Determine MIME type for 3D models
        let mimeType = file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
          if (fileExtension.toLowerCase() === '.glb') {
            mimeType = 'model/gltf-binary';
          } else if (fileExtension.toLowerCase() === '.gltf') {
            mimeType = 'model/gltf+json';
          }
        }
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            file.buffer,
            'products',
            fileName,
            mimeType
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('3D model upload timeout')), 30000)
          )
        ]);
        
        model3dPath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading 3D model:', fileError.message);
        return res.status(500).json({ 
          message: 'Error uploading 3D model', 
          error: fileError.message 
        });
      }
    }

    // Update product with timeout
    await Promise.race([
      product.update({
        name: name || product.name,
        description: description || product.description,
        price: price !== undefined ? parseFloat(price) : product.price,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        weight: weight !== undefined && weight !== null && weight !== '' ? parseFloat(weight) : (product.weight || 0),
        image: imagePath,
        model3dUrl: model3dPath !== undefined ? model3dPath : product.model3dUrl,
        category: category !== undefined ? category : product.category,
        isActive: isActive !== undefined ? isActive : product.isActive
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout')), 8000)
      )
    ]);

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Slow product update: took ${duration}ms`);
    }

    res.json(product);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error updating product (${duration}ms):`, error.message);
    
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - please try again',
        error: 'TIMEOUT'
      });
    }
    
    res.status(500).json({ 
      message: 'Error updating product', 
      error: error.message 
    });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ where: { userId } });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const product = await Product.findOne({
      where: { id, storeId: store.id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image from Supabase Storage if exists
    if (product.image && (product.image.startsWith('products/') || product.image.startsWith('backgrounds/'))) {
      try {
        const bucket = product.image.startsWith('products/') ? 'products' : 'backgrounds';
        await deleteFromSupabase(bucket, product.image);
      } catch (deleteError) {
        console.warn('Error deleting image from Supabase:', deleteError);
        // Continue with product deletion even if image deletion fails
      }
    }

    await product.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Get all categories for a store
export const getCategories = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const store = await Store.findOne({ 
      where: { userId },
      attributes: ['id']
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Get distinct categories from products
    const products = await Product.findAll({
      where: { storeId: store.id },
      attributes: ['category'],
      raw: true
    });

    // Extract unique, non-null categories
    const categories = [...new Set(products.map(p => p.category).filter(c => c && c.trim() !== ''))];
    
    res.json(categories.sort());
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get public products for a store (for published stores)
export const getPublicProducts = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findOne({
      where: { id: storeId, status: 'published' }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    const products = await Product.findAll({
      where: {
        storeId: store.id,
        isActive: true
      },
      attributes: ['id', 'storeId', 'name', 'description', 'price', 'stock', 
                   'image', 'category', 'weight', 'isActive', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get public categories for a published store (no auth required)
export const getPublicCategories = async (req, res) => {
  try {
    const { storeId } = req.params;

    const store = await Store.findOne({
      where: { id: storeId, status: 'published' }
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found or not published' });
    }

    // Get distinct categories from products
    const products = await Product.findAll({
      where: {
        storeId: store.id,
        isActive: true
      },
      attributes: ['category'],
      raw: true
    });

    // Extract unique, non-null categories
    const categories = [...new Set(products.map(p => p.category).filter(c => c && c.trim() !== ''))];
    
    res.json(categories.sort());
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

