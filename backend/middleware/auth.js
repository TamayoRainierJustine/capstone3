import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Customer from '../models/customer.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is for a customer (has type: 'customer')
        if (verified.type === 'customer') {
            // Find the customer in the database
            const customer = await Customer.findByPk(verified.id);
            if (!customer) {
                console.error('Customer not found for ID:', verified.id);
                return res.status(401).json({ message: 'Customer not found' });
            }
            // Set customer object
            req.customer = customer;
            req.user = null; // Ensure req.user is not set for customers
        } else {
            // Find the user in the database (store owner/admin/super_admin)
            const user = await User.findByPk(verified.id);
            if (!user) {
                console.error('User not found for ID:', verified.id);
                return res.status(401).json({ message: 'User not found' });
            }
            // Set the user object with the database user
            req.user = user;
            req.customer = null; // Ensure req.customer is not set for users
        }
        
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired, please log in again' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token, authorization denied' });
        }
        res.status(401).json({ message: 'Token verification failed, authorization denied' });
    }
}; 