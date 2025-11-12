import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the user in the database
        const user = await User.findByPk(verified.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Set the user object with the database user
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        res.status(401).json({ message: 'Token verification failed, authorization denied' });
    }
}; 