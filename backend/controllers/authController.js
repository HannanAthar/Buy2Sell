import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 🔒 SECURITY CONSTANTS
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes
const TOKEN_EXPIRY = '24h'; // Reduced from 7d for security
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in ms

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * 🔒 SECURITY: Set authentication cookie (HttpOnly, Secure, SameSite)
 * This prevents XSS attacks from stealing tokens
 */
const setAuthCookie = (res, token) => {
  res.cookie('access_token', token, {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
};

// Login User/Buyer
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 🔒 SECURITY: Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `Account temporarily locked. Try again in ${remainingMinutes} minutes.`
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // 🔒 SECURITY: Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        await user.save({ validateBeforeSave: false });
        return res.status(429).json({
          error: 'Too many failed attempts. Account locked for 30 minutes.'
        });
      }

      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // 🔒 SECURITY: Reset lockout on successful login & Update lastActivity
    await User.updateOne({ _id: user._id }, {
      $set: {
        lastLogin: new Date(),
        lastActivity: new Date(), // Reset activity timer
        loginAttempts: 0
      },
      $unset: { lockUntil: 1 }
    });

    // Generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    // 🔒 SECURITY: Set HttpOnly cookie
    setAuthCookie(res, token);

    res.json({
      success: true,
      token, // Still included for backward compatibility during migration
      role: user.role,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    next(err);
  }
};


// Forgot Password - Send OTP
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check all collections
    let user = await User.findOne({ email: normalizedEmail });

    // If user not found, return explicit error (User Request)
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'This email is not registered. Please enter a registered email address or sign up.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(otp, salt);

    // Save to user with expiry (15 mins)
    user.resetCodeHash = hash;
    user.resetCodeExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    user.resetAttempts = 0;
    user.resetRequestedAt = Date.now();
    await user.save();

    // Send Email
    const { sendEmail, authTemplates } = await import('../services/emailService.js');
    await sendEmail(authTemplates.passwordResetOTP(user.email, { otp }));

    res.json({
      success: true,
      message: 'OTP has been sent to your registered email.'
    });

  } catch (err) {
    next(err);
  }
};

// Reset Password - Verify OTP and Set New Password
export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check all collections
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired code.' });
    }

    // Check rate limit (max 5 attempts)
    if (user.resetAttempts >= 5) {
      return res.status(429).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    // Check if code exists and is not expired
    if (!user.resetCodeHash || !user.resetCodeExpiry || user.resetCodeExpiry < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(code, user.resetCodeHash);
    if (!isValid) {
      user.resetAttempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Hash New Password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear Reset Fields
    user.resetCodeHash = undefined;
    user.resetCodeExpiry = undefined;
    user.resetAttempts = 0;
    user.passwordChangedAt = Date.now();
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate existing tokens

    await user.save();

    // Send Confirmation Email
    const { sendEmail, authTemplates } = await import('../services/emailService.js');
    try {
      await sendEmail(authTemplates.passwordResetSuccess(user.email));
    } catch (emailErr) {
      console.error('Failed to send reset confirmation email:', emailErr);
      // Don't fail the request if confirmation email fails
    }

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login.'
    });

  } catch (err) {
    next(err);
  }
};