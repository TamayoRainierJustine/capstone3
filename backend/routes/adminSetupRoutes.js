import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

const router = express.Router();

// One-time setup route to create the first super admin
// NOTE: This should be removed or protected after setup
router.post('/setup-super-admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ where: { role: 'super_admin' } });
    if (existingSuperAdmin) {
      return res.status(400).json({ 
        message: 'Super admin already exists. Use the update-user-role endpoint or update directly in database.' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin user
    const superAdmin = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'super_admin',
      isVerified: true,
      emailVerifiedAt: new Date()
    });

    res.status(201).json({ 
      message: 'Super admin created successfully',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role
      }
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({ message: 'Error creating super admin', error: error.message });
  }
});

// Update existing user to super admin (requires authentication or secret key)
router.post('/update-user-role', async (req, res) => {
  try {
    const { email, newRole, secretKey } = req.body;

    // Simple secret key check (you can make this more secure)
    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Unauthorized. Secret key required.' });
    }

    if (!email || !newRole) {
      return res.status(400).json({ message: 'Email and newRole are required' });
    }

    if (!['user', 'admin', 'super_admin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be user, admin, or super_admin' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ role: newRole });

    res.json({ 
      message: `User role updated to ${newRole}`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});

export default router;

