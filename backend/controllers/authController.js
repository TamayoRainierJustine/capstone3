import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import sequelize from '../config/db.js';
import PasswordResetToken from '../models/passwordResetToken.js';
import { sendEmail } from '../utils/email.js';
import { Op } from 'sequelize';
import EmailVerificationToken from '../models/emailVerificationToken.js';

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

    // Create user (unverified by default)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    // Remove password from response
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    // Generate OTP (expires in 30 minutes) and send via email
    try {
      await EmailVerificationToken.update({ used: true }, { where: { email, used: false } });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await EmailVerificationToken.create({ email, code, expiresAt });

      const backendBase = (process.env.BACKEND_URL || '').trim() || `${req.protocol}://${req.get('host')}`;
      const verifyLink = `${backendBase.replace(/\/+$/, '')}/api/auth/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;

      const subject = 'Verify your Structura account';
      const html = `<p>Click the button below to verify your email:</p>
        <p><a href="${verifyLink}" style="background:#6d28d9;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
        <p>Or use this 6-digit code:</p>
        <p style="font-size:20px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>This link/code expires in 30 minutes.</p>`;
      const text = `Verify your Structura account:\n\nClick: ${verifyLink}\n\nOr use code: ${code}\n\nExpires in 30 minutes.`;

      // Fire-and-forget to avoid blocking registration on SMTP latency
      Promise.resolve(sendEmail({ to: email, subject, html, text })).catch(e => {
        console.error('Async verification email failed:', e.message);
      });
    } catch (mailErr) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to send verification email:', mailErr.message);
      }
      // Continue; user can request a new code later
    }

    const duration = Date.now() - startTime;
    // Suppress slow-registration log in production
    if (process.env.NODE_ENV !== 'production') {
      if (duration > 3000) {
        console.warn(`Slow registration: took ${duration}ms`);
      }
    }

    res.status(201).json({
      message: 'User registered. Please check your email for the verification code.',
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

    // Require verified email
    if (user.isVerified === false) {
      return res.status(403).json({ message: 'Please verify your email to continue' });
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

export const verifyEmailWithCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });
  try {
    const token = await EmailVerificationToken.findOne({
      where: {
        email,
        code,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
    if (!token) return res.status(400).json({ message: 'Invalid or expired code' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid request' });

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    token.used = true;
    await token.save();

    return res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error('verifyEmailWithCode error:', err);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
};

// GET link-based verification: /api/auth/verify?email=...&code=...
export const verifyEmailLink = async (req, res) => {
  const email = req.query.email;
  const code = req.query.code;
  const frontendBase = (process.env.FRONTEND_URL || '').trim() || 'https://structurawebbuilder.vercel.app';
  try {
    if (!email || !code) {
      return res.redirect(`${frontendBase.replace(/\/+$/, '')}/login?verified=0&reason=missing_params`);
    }
    const token = await EmailVerificationToken.findOne({
      where: {
        email,
        code,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
    if (!token) {
      return res.redirect(`${frontendBase.replace(/\/+$/, '')}/login?verified=0&reason=invalid_or_expired`);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.redirect(`${frontendBase.replace(/\/+$/, '')}/login?verified=0&reason=user_not_found`);
    }

    user.isVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    token.used = true;
    await token.save();

    return res.redirect(`${frontendBase.replace(/\/+$/, '')}/login?verified=1`);
  } catch (err) {
    console.error('verifyEmailLink error:', err);
    return res.redirect(`${frontendBase.replace(/\/+$/, '')}/login?verified=0&reason=server_error`);
  }
};

export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  try {
    const user = await User.findOne({ where: { email }, attributes: ['id', 'email', 'isVerified'] });
    // Always return 200 to avoid enumeration; only send if user exists and not verified
    if (user && user.isVerified === false) {
      await EmailVerificationToken.update({ used: true }, { where: { email, used: false } });
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await EmailVerificationToken.create({ email, code, expiresAt });

      const backendBase = (process.env.BACKEND_URL || '').trim() || `${req.protocol}://${req.get('host')}`;
      const verifyLink = `${backendBase.replace(/\/+$/, '')}/api/auth/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;

      const subject = 'Your new Structura verification code';
      const html = `<p>Click the button below to verify your email:</p>
        <p><a href="${verifyLink}" style="background:#6d28d9;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
        <p>Or use this code if prompted:</p>
        <p style="font-size:20px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>This link/code expires in 30 minutes.</p>`;
      const text = `Verify your Structura account:\n\nClick: ${verifyLink}\n\nOr use code: ${code}\n\nExpires in 30 minutes.`;

      // Fire-and-forget to avoid blocking the API call on SMTP latency
      Promise.resolve(sendEmail({ to: email, subject, html, text })).catch(e => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Resend verification email failed (async):', e.message);
        }
      });

      return res.json({ message: 'A new verification code has been sent to your email.' });
    }
    return res.json({ message: 'If the account is unverified, a new code was sent.' });
  } catch (err) {
    console.error('resendVerificationCode error:', err);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
};
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Always respond success to avoid email enumeration, but actually create code only if user exists
    const user = await User.findOne({ where: { email }, attributes: ['id', 'email'] });
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    if (user) {
      // Invalidate previous active tokens for this email
      await PasswordResetToken.update({ used: true }, { where: { email, used: false } });
      await PasswordResetToken.create({ email, code, expiresAt });

      const subject = 'Your Structura password reset code';
      const html = `<p>Use this verification code to reset your password:</p>
        <p style="font-size:20px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>This code expires in 15 minutes.</p>`;
      const text = `Your password reset code is: ${code} (expires in 15 minutes)`;
      try {
        await sendEmail({ to: email, subject, html, text });
      } catch (e) {
        // Log but still respond 200 to avoid leaking
        console.error('Email send failed:', e.message);
      }
    }

    return res.json({ message: 'If that email exists, a code has been sent.' });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    return res.status(500).json({ message: 'Failed to process request' });
  }
};

export const resetPasswordWithCode = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, code and newPassword are required' });
  }
  try {
    const token = await PasswordResetToken.findOne({
      where: {
        email,
        code,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid request' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    token.used = true;
    await token.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('resetPasswordWithCode error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};
