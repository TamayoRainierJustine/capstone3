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
                     'image', 'isActive', 'createdAt', 'updatedAt'],
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

    const { name, description, price, stock, isActive } = req.body;
    
    // Validate required fields
    if (!name || !description || !price) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, description, and price are required' 
      });
    }

    let imagePath = null;

    // Handle file upload to Supabase Storage with timeout
    if (req.file) {
      try {
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `product_${Date.now()}${fileExtension}`;
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            req.file.buffer,
            'products',
            fileName,
            req.file.mimetype
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File upload timeout')), 15000)
          )
        ]);
        
        imagePath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading file:', fileError.message);
        // If it's a timeout or connection error, provide helpful message
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

    // Create product with timeout
    const product = await Promise.race([
      Product.create({
        storeId: store.id,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        image: imagePath,
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

    const { name, description, price, stock, isActive } = req.body;
    let imagePath = product.image;

    // Handle file upload if new image provided (with timeout)
    if (req.file) {
      try {
        // Delete old image from Supabase Storage if exists (non-blocking)
        if (product.image && (product.image.startsWith('products/') || product.image.startsWith('backgrounds/'))) {
          deleteFromSupabase('products', product.image).catch(err => {
            console.warn('Error deleting old image:', err.message);
          });
        }

        // Upload new image to Supabase Storage with timeout
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `product_${Date.now()}${fileExtension}`;
        
        const uploadResult = await Promise.race([
          uploadToSupabase(
            req.file.buffer,
            'products',
            fileName,
            req.file.mimetype
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('File upload timeout')), 15000)
          )
        ]);
        
        imagePath = uploadResult.path;
      } catch (fileError) {
        console.error('Error uploading file:', fileError.message);
        return res.status(500).json({ 
          message: 'Error uploading product image', 
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
        image: imagePath,
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
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

