import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import sequelize from '../config/db.js';

export const register = async (req, res) => {
  const startTime = Date.now();
  const { firstName, lastName, email, password } = req.body;
  
  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email']
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Remove password from response
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`Slow registration: took ${duration}ms`);
    }

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: userWithoutPassword 
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Registration error (${duration}ms):`, err.message);
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    console.error('Error original:', err.original);
    
    // Handle all Sequelize errors as database errors
    if (err.name && err.name.startsWith('Sequelize')) {
      // Handle unique constraint (duplicate email) separately
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ 
          message: 'User already exists',
          error: 'DUPLICATE_EMAIL'
        });
      }
      
      // All other Sequelize errors are database errors
      console.error('Sequelize error detected:', err.name);
      return res.status(503).json({ 
        message: 'Database error - please try again',
        error: 'DATABASE_ERROR',
        details: err.message
      });
    }
    
    // Handle database connection errors
    if (err.code === 'ECONNREFUSED' || 
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('Connection') ||
        err.message?.includes('connect') ||
        err.message?.includes('timeout')) {
      console.error('Database connection error detected');
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR',
        details: err.message
      });
    }
    
    res.status(500).json({ 
      message: 'Registration failed', 
      error: err.message || 'Unknown error occurred'
    });
  }
};

export const login = async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;
  
  try {
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user - optimized query for performance
    // Query will establish connection if needed (lazy connection)
    const user = await User.findOne({ 
      where: { email },
      attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'role'],
      raw: false // Keep as Sequelize instance for password access
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: '1d',
      }
    );

    // Remove password from user object before sending
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`Slow login: took ${duration}ms`);
    }

    res.json({ 
      message: 'Logged in successfully', 
      token, 
      user: userWithoutPassword 
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Login error (${duration}ms):`, err.message);
    console.error('Error stack:', err.stack);
    console.error('Error name:', err.name);
    console.error('Error code:', err.code);
    console.error('Error original:', err.original);
    
    // Handle all Sequelize errors as database errors
    if (err.name && err.name.startsWith('Sequelize')) {
      console.error('Sequelize error detected:', err.name);
      return res.status(503).json({ 
        message: 'Database error - please try again',
        error: 'DATABASE_ERROR',
        details: err.message
      });
    }
    
    // Handle database connection errors
    if (err.code === 'ECONNREFUSED' || 
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('Connection') ||
        err.message?.includes('connect') ||
        err.message?.includes('timeout')) {
      console.error('Database connection error detected');
      return res.status(503).json({ 
        message: 'Database connection error - please try again',
        error: 'DATABASE_ERROR',
        details: err.message
      });
    }
    
    res.status(500).json({ 
      message: 'Login failed', 
      error: err.message || 'Unknown error occurred'
    });
  }
};
