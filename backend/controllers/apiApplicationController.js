import ApiApplication from '../models/apiApplication.js';
import User from '../models/user.js';
import Store from '../models/store.js';
import { Op } from 'sequelize';
import multer from 'multer';
import path from 'path';
import { uploadToSupabase } from '../utils/supabaseStorage.js';

// Configure multer for document uploads
const storage = multer.memoryStorage();
export const uploadDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});

// Create API application (Store Owner)
export const createApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      storeId,
      apiType,
      businessName,
      businessAddress,
      contactNumber,
      email
    } = req.body;

    if (!storeId || !apiType || !businessName || !businessAddress || !contactNumber || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if store belongs to user
    const store = await Store.findOne({ where: { id: storeId, userId } });
    if (!store) {
      return res.status(403).json({ message: 'Store not found or access denied' });
    }

    // Check if there's already a pending application
    const existingApp = await ApiApplication.findOne({
      where: {
        storeId,
        apiType: apiType === 'both' ? { [Op.in]: ['qr', 'shipping', 'both'] } : apiType,
        status: { [Op.in]: ['pending', 'under_review'] }
      }
    });

    if (existingApp) {
      return res.status(400).json({ message: 'You already have a pending application for this API type' });
    }

    // Handle file uploads
    let birDocumentPath = null;
    let businessPermitPath = null;
    let validIdPath = null;
    const otherDocs = [];

    if (req.files) {
      if (req.files.birDocument) {
        const file = req.files.birDocument[0];
        const fileName = `bir_${Date.now()}${path.extname(file.originalname)}`;
        const uploadResult = await uploadToSupabase(file.buffer, 'documents', fileName, file.mimetype);
        birDocumentPath = uploadResult.path;
      }

      if (req.files.businessPermit) {
        const file = req.files.businessPermit[0];
        const fileName = `permit_${Date.now()}${path.extname(file.originalname)}`;
        const uploadResult = await uploadToSupabase(file.buffer, 'documents', fileName, file.mimetype);
        businessPermitPath = uploadResult.path;
      }

      if (req.files.validId) {
        const file = req.files.validId[0];
        const fileName = `validid_${Date.now()}${path.extname(file.originalname)}`;
        const uploadResult = await uploadToSupabase(file.buffer, 'documents', fileName, file.mimetype);
        validIdPath = uploadResult.path;
      }

      if (req.files.otherDocuments) {
        for (const file of req.files.otherDocuments) {
          const fileName = `other_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
          const uploadResult = await uploadToSupabase(file.buffer, 'documents', fileName, file.mimetype);
          otherDocs.push(uploadResult.path);
        }
      }
    }

    const application = await ApiApplication.create({
      userId,
      storeId,
      apiType,
      businessName,
      businessAddress,
      contactNumber,
      email,
      birDocument: birDocumentPath,
      businessPermit: businessPermitPath,
      validId: validIdPath,
      otherDocuments: otherDocs.length > 0 ? otherDocs : null,
      status: 'pending'
    });

    const applicationWithDetails = await ApiApplication.findByPk(application.id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] }
      ]
    });

    res.status(201).json(applicationWithDetails);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ message: 'Error creating application', error: error.message });
  }
};

// Get my applications (Store Owner)
export const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const applications = await ApiApplication.findAll({
      where: whereClause,
      include: [
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

// Get all applications (Super Admin)
export const getAllApplications = async (req, res) => {
  try {
    const { status, apiType } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (apiType) whereClause.apiType = apiType;

    const applications = await ApiApplication.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

// Get application details
export const getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const application = await ApiApplication.findByPk(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check access
    if (userRole !== 'super_admin' && application.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
};

// Review application (Super Admin)
export const reviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { action, reviewNotes, rejectionReason, qrApiKey, shippingApiKey } = req.body;

    if (!action || !['approve', 'reject', 'under_review'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be approve, reject, or under_review' });
    }

    const application = await ApiApplication.findByPk(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const updateData = {
      reviewedBy: userId,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || null
    };

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.approvedAt = new Date();
      if (qrApiKey) updateData.qrApiKey = qrApiKey;
      if (shippingApiKey) updateData.shippingApiKey = shippingApiKey;

      // Update store with API keys if provided
      if (qrApiKey || shippingApiKey) {
        const store = await Store.findByPk(application.storeId);
        if (store) {
          const content = store.content ? (typeof store.content === 'string' ? JSON.parse(store.content) : store.content) : {};
          
          if (qrApiKey && (application.apiType === 'qr' || application.apiType === 'both')) {
            if (!content.payment) content.payment = {};
            content.payment.qrApiKey = qrApiKey;
          }

          if (shippingApiKey && (application.apiType === 'shipping' || application.apiType === 'both')) {
            content.googleMapsApiKey = shippingApiKey;
          }

          await store.update({ content: JSON.stringify(content) });
        }
      }
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejectionReason = rejectionReason || null;
    } else {
      updateData.status = 'under_review';
    }

    await application.update(updateData);

    const updatedApplication = await ApiApplication.findByPk(id, {
      include: [
        { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Store, attributes: ['id', 'storeName', 'domainName'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({ message: 'Error reviewing application', error: error.message });
  }
};

