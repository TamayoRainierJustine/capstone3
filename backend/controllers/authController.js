import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/user.js';
import Customer from '../models/customer.js';
import sequelize from '../config/db.js';
import PasswordResetToken from '../models/passwordResetToken.js';
import EmailVerificationToken from '../models/emailVerificationToken.js';
import CustomerVerificationToken from '../models/customerVerificationToken.js';
import { sendEmail } from '../utils/email.js';

const PASSWORD_REQUIREMENTS_TEXT = 'Password must be at least 8 characters and include uppercase, lowercase, and a number.';

const validatePasswordStrength = (password) => {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number.');
  }
  return errors;
};

const sendVerificationEmail = async ({ email, firstName = 'there', req }) => {
  try {
    await EmailVerificationToken.update({ used: true }, { where: { email, used: false } });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await EmailVerificationToken.create({ email, code, expiresAt });

    const backendBase = (process.env.BACKEND_URL || '').trim() || `${req.protocol}://${req.get('host')}`;
    const verifyLink = `${backendBase.replace(/\/+$/, '')}/api/auth/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`;
    const subject = 'Verify your Structura account';
    const html = `<p>Welcome to Structura, ${firstName}!</p>
      <p>Click the button below to verify your email:</p>
      <p><a href="${verifyLink}" style="background:#6d28d9;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a></p>
      <p>Or use this code if prompted: <strong style="letter-spacing:4px;font-size:20px">${code}</strong></p>
      <p>This link/code expires in 30 minutes.</p>`;
    const text = `Verify your Structura account: ${verifyLink} or use code ${code} (expires in 30 minutes).`;
    await sendEmail({ to: email, subject, html, text });
    return true;
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
    return false;
  }
};

const sendCustomerVerificationEmail = async ({ email, firstName = 'there' }) => {
  try {
    await CustomerVerificationToken.update({ used: true }, { where: { email, used: false } });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await CustomerVerificationToken.create({ email, code, expiresAt });

    const subject = 'Verify your Structura shop account';
    const html = `<p>Hi ${firstName || 'there'},</p>
      <p>Use this verification code to activate your Structura buyer account:</p>
      <p style="font-size:22px;letter-spacing:6px;font-weight:bold">${code}</p>
      <p>This code expires in 30 minutes.</p>`;
    const text = `Your Structura verification code is ${code}. It expires in 30 minutes.`;

    await sendEmail({ to: email, subject, html, text });
    return true;
  } catch (err) {
    console.error('Failed to send customer verification email:', err.message);
    return false;
  }
};

export const register = async (req, res) => {
  const startTime = Date.now();
  const { firstName, lastName, email, password } = req.body;
  
  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: PASSWORD_REQUIREMENTS_TEXT,
        errors: passwordErrors,
        error: 'WEAK_PASSWORD'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'firstName', 'isVerified']
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const resendSuccess = await sendVerificationEmail({
        email,
        firstName: existingUser.firstName || 'there',
        req
      });

      return res.status(resendSuccess ? 200 : 202).json({
        message: resendSuccess
          ? 'Account already exists but is not verified. We sent a new verification email.'
          : 'Account already exists but is not verified. Please request a new verification link from the login page.',
        requiresVerification: true
      });
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

    const verificationEmailSent = await sendVerificationEmail({
      email,
      firstName,
      req
    });

    const duration = Date.now() - startTime;
    // Suppress slow-registration log in production
    if (process.env.NODE_ENV !== 'production') {
      if (duration > 3000) {
        console.warn(`Slow registration: took ${duration}ms`);
      }
    }

    res.status(201).json({
      message: verificationEmailSent
        ? 'Registration successful! Please verify via the email we just sent.'
        : 'Registration successful! Please request a new verification link from the login page.',
      user: userWithoutPassword,
      requiresVerification: true
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

export const testEmailSend = async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: 'Recipient email `to` is required' });
  try {
    const subject = 'Structura SMTP Test';
    const html = `<p>This is a test email from Structura backend at ${new Date().toISOString()}.</p>`;
    const text = `This is a test email from Structura backend at ${new Date().toISOString()}.`;
    const info = await sendEmail({ to, subject, html, text });
    return res.json({ message: 'Test email sent', messageId: info?.messageId, response: info?.response });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send test email', error: err?.message || String(err) });
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
      attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'role', 'isVerified'],
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

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        error: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true
      });
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

  const passwordErrors = validatePasswordStrength(newPassword);
  if (passwordErrors.length > 0) {
    return res.status(400).json({
      message: PASSWORD_REQUIREMENTS_TEXT,
      errors: passwordErrors,
      error: 'WEAK_PASSWORD'
    });
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

// Customer registration (for published store buyers)
export const registerCustomer = async (req, res) => {
  const startTime = Date.now();
  const { firstName, lastName, email, password, region, province, municipality, barangay, houseNumber, street } = req.body;
  
  try {
    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        message: PASSWORD_REQUIREMENTS_TEXT,
        errors: passwordErrors,
        error: 'WEAK_PASSWORD'
      });
    }

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'firstName', 'isVerified']
    });

    if (existingCustomer) {
      if (existingCustomer.isVerified) {
        return res.status(400).json({ message: 'Customer already exists' });
      }

      const resent = await sendCustomerVerificationEmail({
        email,
        firstName: existingCustomer.firstName
      });

      return res.status(resent ? 200 : 202).json({
        message: resent
          ? 'Account already exists but is not verified. We resent the verification code.'
          : 'Account already exists but is not verified. Please request a new verification code.',
        requiresVerification: true
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer with address fields
    const customer = await Customer.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isVerified: false,
      // Address fields (optional during registration)
      region: region || null,
      province: province || null,
      municipality: municipality || null,
      barangay: barangay || null,
      houseNumber: houseNumber || null,
      street: street || null
    });

    const verificationEmailSent = await sendCustomerVerificationEmail({
      email,
      firstName
    });

    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'production' && duration > 3000) {
      console.warn(`Slow customer registration: took ${duration}ms`);
    }

    res.status(201).json({
      message: verificationEmailSent
        ? 'Registration successful! We sent a verification code to your email.'
        : 'Registration successful! Please request a new verification code.',
      requiresVerification: true
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Customer registration error (${duration}ms):`, err.message);
    
    // Handle unique constraint (duplicate email)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'Customer already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }
    
    // Handle database errors
    if (err.name && err.name.startsWith('Sequelize')) {
      return res.status(503).json({ 
        message: 'Database error - please try again',
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

// Customer login (for published store buyers)
export const loginCustomer = async (req, res) => {
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

    // Find customer
    const customer = await Customer.findOne({ 
      where: { email },
      attributes: ['id', 'firstName', 'lastName', 'email', 'password', 'isVerified'],
      raw: false
    });

    if (!customer) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!customer.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        requiresVerification: true
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token with customer type
    const token = jwt.sign(
      { 
        id: customer.id, 
        email: customer.email,
        type: 'customer' // Mark as customer token
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: '1d',
      }
    );

    // Remove password from customer object before sending
    const customerWithoutPassword = {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      type: 'customer'
    };

    const duration = Date.now() - startTime;
    if (duration > 3000) {
      console.warn(`Slow customer login: took ${duration}ms`);
    }

    res.json({ 
      message: 'Logged in successfully', 
      token, 
      user: customerWithoutPassword 
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`Customer login error (${duration}ms):`, err.message);
    
    // Handle database errors
    if (err.name && err.name.startsWith('Sequelize')) {
      return res.status(503).json({ 
        message: 'Database error - please try again',
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

export const verifyCustomerWithCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  try {
    const token = await CustomerVerificationToken.findOne({
      where: {
        email,
        code,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const customer = await Customer.findOne({ where: { email } });
    if (!customer) {
      return res.status(400).json({ message: 'Account not found' });
    }

    customer.isVerified = true;
    customer.emailVerifiedAt = new Date();
    await customer.save();

    token.used = true;
    await token.save();

    return res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('verifyCustomerWithCode error:', err.message);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
};

export const resendCustomerVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const customer = await Customer.findOne({
      where: { email },
      attributes: ['id', 'firstName', 'isVerified']
    });

    if (!customer) {
      return res.status(200).json({ message: 'If the account exists, we resent a code.' });
    }

    if (customer.isVerified) {
      return res.status(200).json({ message: 'Account is already verified.' });
    }

    const sent = await sendCustomerVerificationEmail({
      email,
      firstName: customer.firstName
    });

    return res.status(sent ? 200 : 202).json({
      message: sent
        ? 'A new verification code was sent to your email.'
        : 'Unable to send email. Please try again later.'
    });
  } catch (err) {
    console.error('resendCustomerVerification error:', err.message);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
};

// Get current authenticated user info
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authenticateToken middleware
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Return user data without password
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Error fetching user data', error: error.message });
  }
};
