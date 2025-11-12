import Store from '../models/store.js';
import User from '../models/user.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import { uploadToSupabase } from '../utils/supabaseStorage.js';

// Configure multer for background image uploads (memory storage for Supabase)
const storage = multer.memoryStorage();

export const uploadBackground = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create a new store for a user
export const createStore = async (req, res) => {
  try {
    let { templateId, storeName, description, domainName, region, province, municipality, barangay, contactEmail, phone } = req.body;
    
    // Normalize domain name: lowercase, remove spaces, remove special characters except hyphens
    if (domainName) {
      domainName = domainName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    }
    
    // Get userId from the authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      console.error('No user ID found in request:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Creating store for user:', userId);
    console.log('   Domain name (normalized):', domainName);
    
    const store = await Store.create({
      userId,
      templateId,
      storeName,
      description,
      domainName,
      region,
      province,
      municipality,
      barangay,
      contactEmail,
      phone
    });
    
    console.log('Store created successfully:', store.id);
    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    
    // Check for duplicate domain name
    if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === 'ER_DUP_ENTRY') {
      if (error.errors?.some(e => e.path === 'domainName') || error.parent?.message?.includes('domainName')) {
        return res.status(400).json({ 
          message: 'A store with this domain name already exists. Please choose a different domain name.',
          details: error.parent?.message || 'Duplicate domain name'
        });
      }
      if (error.errors?.some(e => e.path === 'storeName') || error.parent?.message?.includes('storeName')) {
        return res.status(400).json({ 
          message: 'You already have a store with this name. Please choose a different name or update your existing store.',
          details: error.parent?.message || 'Duplicate store name'
        });
      }
    }
    
    res.status(400).json({ 
      message: error.message || 'Validation error',
      details: error.parent?.message || error.message || 'Unknown error occurred'
    });
  }
};

// Get all stores for a specific user
export const getUserStores = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Optimize query - remove User include if not needed, add timeout
    const stores = await Promise.race([
      Store.findAll({ 
        where: { userId },
        attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                     'region', 'province', 'municipality', 'barangay', 'contactEmail', 
                     'phone', 'status', 'content', 'createdAt', 'updatedAt'],
        limit: 100 // Limit to prevent large queries
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 25000)
      )
    ]);
    
    // Parse content for each store if it's a string (optimized)
    const storesData = stores.map(store => {
      const storeData = store.toJSON();
      // Only parse if it's a string and not too large
      if (storeData.content && typeof storeData.content === 'string' && storeData.content.length < 1000000) {
        try {
          storeData.content = JSON.parse(storeData.content);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      return storeData;
    });
    
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Slow query: getUserStores took ${duration}ms`);
    }
    
    res.status(200).json(storesData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error fetching stores (${duration}ms):`, error.message);
    
    // Handle timeout specifically
    if (error.message === 'Query timeout' || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - database query took too long',
        error: 'TIMEOUT'
      });
    }
    
    res.status(500).json({ 
      message: error.message || 'Error fetching stores',
      error: error.name || 'UNKNOWN_ERROR'
    });
  }
};

// Update a store
export const updateStore = async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;
  let { templateId, storeName, description, domainName, region, province, municipality, barangay, contactEmail, phone } = req.body;
  
  // Normalize domain name if provided
  if (domainName) {
    domainName = domainName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get store with timeout
    const store = await Promise.race([
      Store.findByPk(id, {
        attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                     'region', 'province', 'municipality', 'barangay', 'contactEmail', 'phone']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    // Check if domain name is being changed and if it conflicts with another store
    if (domainName && domainName !== store.domainName) {
      const existingStore = await Promise.race([
        Store.findOne({ 
          where: { 
            domainName, 
            id: { [Op.ne]: id } // Exclude current store
          },
          attributes: ['id']
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        )
      ]);
      
      if (existingStore) {
        return res.status(400).json({ 
          message: `A store with the domain name "${domainName}" already exists. Please choose a different domain name.`,
          details: 'Duplicate domain name'
        });
      }
    }

    // Update store with timeout
    await Promise.race([
      store.update({
        templateId: templateId || store.templateId,
        storeName: storeName || store.storeName,
        description: description || store.description,
        domainName: domainName || store.domainName,
        region: region || store.region,
        province: province || store.province,
        municipality: municipality || store.municipality,
        barangay: barangay || store.barangay,
        contactEmail: contactEmail || store.contactEmail,
        phone: phone || store.phone
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout')), 8000)
      )
    ]);

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Slow store update: took ${duration}ms`);
    }

    res.status(200).json(store);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error updating store (${duration}ms):`, error.message);
    
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - please try again',
        error: 'TIMEOUT'
      });
    }
    
    // Check for duplicate domain name
    if (error.name === 'SequelizeUniqueConstraintError' || error.parent?.code === 'ER_DUP_ENTRY') {
      if (error.errors?.some(e => e.path === 'domainName') || error.parent?.message?.includes('domainName')) {
        return res.status(400).json({ 
          message: 'A store with this domain name already exists. Please choose a different domain name.',
          details: error.parent?.message || 'Duplicate domain name'
        });
      }
    }
    
    res.status(400).json({ 
      message: error.message || 'Validation error',
      details: error.parent?.message || error.message || 'Unknown error occurred'
    });
  }
};

// Delete a store
export const deleteStore = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this store' });
    }

    await store.destroy();
    res.status(200).json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ message: error.message || 'Error deleting store' });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findOne({
      where: { id: req.params.id },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }]
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this store' });
    }

    // Parse content if it's a string
    const storeData = store.toJSON();
    if (storeData.content && typeof storeData.content === 'string') {
      try {
        storeData.content = JSON.parse(storeData.content);
      } catch (e) {
        console.error('Error parsing store content:', e);
      }
    }
    
    res.json(storeData);
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({
      message: 'Error fetching store',
      error: error.message
    });
  }
};

// Upload background image to Supabase Storage
export const uploadBackgroundImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Supabase Storage
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `bg-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    const { path: storagePath, url: publicUrl } = await uploadToSupabase(
      req.file.buffer,
      'backgrounds',
      fileName,
      req.file.mimetype
    );

    // Return the storage path (frontend will construct full URL using getImageUrl)
    res.status(200).json({ 
      message: 'Background image uploaded successfully',
      imageUrl: storagePath, // Return path like "backgrounds/bg-123.jpg"
      publicUrl: publicUrl // Also return full URL for convenience
    });
  } catch (error) {
    console.error('Error uploading background image to Supabase:', error);
    // If it's a timeout or connection error, provide helpful message
    if (error.message && (error.message.includes('timeout') || error.message.includes('acquire'))) {
      return res.status(503).json({
        message: 'Upload timeout - please try again. The connection is being established.',
        error: error.message,
        retry: true
      });
    }
    res.status(500).json({
      message: 'Error uploading background image',
      error: error.message
    });
  }
};

// Save store content (hero, products, etc.)
export const saveStoreContent = async (req, res) => {
  const startTime = Date.now();
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validate content size (limit to 5MB)
    const contentSize = JSON.stringify(content).length;
    if (contentSize > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        message: 'Content too large. Maximum size is 5MB.',
        error: 'CONTENT_TOO_LARGE'
      });
    }

    // Get store with timeout
    const store = await Promise.race([
      Store.findByPk(id, {
        attributes: ['id', 'userId']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    // Ensure content is a proper object
    const contentToSave = typeof content === 'string' ? JSON.parse(content) : content;
    
    // Update with timeout
    await Promise.race([
      store.update({ content: contentToSave }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Update timeout')), 8000)
      )
    ]);
    
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.warn(`Slow content save: took ${duration}ms, size: ${(contentSize / 1024).toFixed(2)}KB`);
    }
    
    res.status(200).json({ 
      message: 'Store content saved successfully',
      content: contentToSave
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error saving store content (${duration}ms):`, error.message);
    
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        message: 'Request timeout - please try again',
        error: 'TIMEOUT'
      });
    }
    
    res.status(500).json({
      message: 'Error saving store content',
      error: error.message
    });
  }
};

// Publish or unpublish a store
export const publishStore = async (req, res) => {
  try {
    console.log('📢 publishStore function called!');
    console.log('   Request params:', req.params);
    console.log('   Request body:', req.body);
    console.log('   User:', req.user?.id);
    
    const { id } = req.params;
    const { status } = req.body; // 'published' or 'draft'

    if (status !== 'published' && status !== 'draft') {
      return res.status(400).json({ message: 'Status must be "published" or "draft"' });
    }

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if the store belongs to the authenticated user
    if (store.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    await store.update({ status });
    res.status(200).json({ 
      message: `Store ${status === 'published' ? 'published' : 'unpublished'} successfully`,
      store 
    });
  } catch (error) {
    console.error('Error publishing store:', error);
    res.status(500).json({
      message: 'Error publishing store',
      error: error.message
    });
  }
};

// Get published store by domain (public route - no auth required)
export const getPublishedStoreByDomain = async (req, res) => {
  try {
    let { domain } = req.params;
    
    // Decode the domain parameter (handles URL encoding like %20 for spaces)
    domain = decodeURIComponent(domain);
    
    // Normalize domain the same way as when creating stores:
    // lowercase, remove spaces, remove special characters except hyphens
    let normalizedDomain = domain
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    console.log('🔍 Looking for published store');
    console.log('🔍 Original domain from URL:', domain);
    console.log('🔍 Normalized domain:', normalizedDomain);

    // First try exact match with normalized domain
    let store = await Store.findOne({
      where: { 
        domainName: normalizedDomain,
        status: 'published'
      },
      include: [{
        model: User,
        attributes: ['email', 'firstName', 'lastName']
      }],
      attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                   'region', 'province', 'municipality', 'barangay', 'contactEmail', 'phone', 
                   'status', 'content', 'createdAt', 'updatedAt']
    });
    
    // If not found, try case-insensitive search as fallback
    if (!store) {
      console.log('⚠️ Exact match not found, trying case-insensitive search...');
      store = await Store.findOne({
        where: { 
          domainName: {
            [Op.iLike]: normalizedDomain  // Case-insensitive match (PostgreSQL)
          },
          status: 'published'
        },
        include: [{
          model: User,
          attributes: ['email', 'firstName', 'lastName']
        }],
        attributes: ['id', 'userId', 'templateId', 'storeName', 'description', 'domainName', 
                     'region', 'province', 'municipality', 'barangay', 'contactEmail', 'phone', 
                     'status', 'content', 'createdAt', 'updatedAt']
      });
    }

    if (!store) {
      console.log('❌ Store not found with domain:', domain);
      // Try to find all published stores to help debug
      const allPublished = await Store.findAll({
        where: { status: 'published' },
        attributes: ['id', 'storeName', 'domainName'],
        raw: true
      });
      console.log('📋 All published stores:', allPublished);
      return res.status(404).json({ 
        message: 'Store not found or not published',
        searchedDomain: domain,
        availableDomains: allPublished.map(s => s.domainName)
      });
    }
    
    console.log('✅ Found store:', store.storeName, 'with domain:', store.domainName);

    // Parse content if it's a string (Sequelize might return it as string)
    const storeData = store.toJSON();
    if (storeData.content && typeof storeData.content === 'string') {
      try {
        storeData.content = JSON.parse(storeData.content);
      } catch (e) {
        console.error('Error parsing store content:', e);
      }
    }
    
    console.log('📦 Published store content:', storeData.content);
    console.log('📦 Published store background:', storeData.content?.background);

    res.json(storeData);
  } catch (error) {
    console.error('Error fetching published store:', error);
    res.status(500).json({
      message: 'Error fetching published store',
      error: error.message
    });
  }
}; 