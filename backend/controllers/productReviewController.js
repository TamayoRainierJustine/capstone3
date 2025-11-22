import ProductReview from '../models/productReview.js';
import Product from '../models/product.js';
import Customer from '../models/customer.js';
import Order from '../models/order.js';
import OrderItem from '../models/orderItem.js';
import { Op } from 'sequelize';

// Get all reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating = null } = req.query;

    const whereClause = {
      productId,
      isVisible: true
    };

    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await ProductReview.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          as: 'Customer',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Calculate average rating and rating distribution
    const allReviews = await ProductReview.findAll({
      where: { productId, isVisible: true },
      attributes: ['rating']
    });

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length
    };

    res.json({
      reviews: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      statistics: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Create a product review (customer only, authenticated)
export const createProductReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const customerId = req.customer?.id || req.user?.id; // Support both customer and user tokens
    const { rating, comment, orderId, images = [] } = req.body;

    if (!customerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if customer already reviewed this product
    const existingReview = await ProductReview.findOne({
      where: {
        productId,
        customerId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Verify purchase if orderId is provided
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        where: {
          id: orderId,
          customerId
        },
        include: [
          {
            model: OrderItem,
            where: { productId },
            required: true
          }
        ]
      });

      if (order) {
        isVerifiedPurchase = true;
      }
    }

    // Create review
    const review = await ProductReview.create({
      productId,
      customerId,
      orderId: orderId || null,
      rating,
      comment: comment || null,
      images: Array.isArray(images) ? images : [],
      isVerifiedPurchase
    });

    // Include customer info in response
    const reviewWithCustomer = await ProductReview.findByPk(review.id, {
      include: [
        {
          model: Customer,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          as: 'Customer'
        }
      ]
    });

    res.status(201).json({
      message: 'Review created successfully',
      review: reviewWithCustomer
    });
  } catch (error) {
    console.error('Error creating product review:', error);
    res.status(500).json({ message: 'Error creating review', error: error.message });
  }
};

// Update a product review (only by the reviewer)
export const updateProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id || req.user?.id;
    const { rating, comment, images } = req.body;

    if (!customerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const review = await ProductReview.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if customer owns this review
    if (review.customerId !== customerId) {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Update review
    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) {
      updateData.comment = comment;
    }
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? images : [];
    }

    await review.update(updateData);

    // Include customer info in response
    const updatedReview = await ProductReview.findByPk(review.id, {
      include: [
        {
          model: Customer,
          attributes: ['id', 'firstName', 'lastName', 'email'],
          as: 'Customer'
        }
      ]
    });

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Error updating product review:', error);
    res.status(500).json({ message: 'Error updating review', error: error.message });
  }
};

// Delete a product review (only by the reviewer or store owner)
export const deleteProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.customer?.id || req.user?.id;
    const userRole = req.user?.role;

    if (!customerId && !userRole) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const review = await ProductReview.findByPk(id, {
      include: [
        {
          model: Product,
          attributes: ['storeId']
        }
      ]
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if customer owns this review or user is store owner
    const isOwner = review.customerId === customerId;
    const isStoreOwner = userRole === 'admin' && req.user && 
                        (await Product.findByPk(review.productId))?.storeId === req.user.id;

    if (!isOwner && !isStoreOwner) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await review.destroy();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting product review:', error);
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
