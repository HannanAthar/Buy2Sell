import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { validatePasswordStrength, sanitizeString, sanitizeEmail } from '../utils/sanitize.js';

export const registerUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      phone,
      agreeToTerms
    } = req.body;

    // Input validation
    if (!fullName || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    // Check terms agreement
    if (!agreeToTerms || agreeToTerms !== 'true') {
      return res.status(400).json({ error: 'You must agree to the terms and conditions.' });
    }

    // 🔒 SECURITY: Sanitize and trim inputs
    const trimmedFullName = sanitizeString(fullName);
    const trimmedEmail = sanitizeEmail(email);
    const trimmedPhone = phone.trim().replace(/\D/g, '').slice(0, 11);

    // Additional validation checks
    if (trimmedFullName.length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters long.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Phone validation (Strict 11 digits starting with 03)
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit phone number (e.g., 03123456789)' });
    }

    // Password validation
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // 🔒 SECURITY: Enhanced password strength validation
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    // 🔥 GLOBAL UNIQUENESS CHECK (Name & Email across Users, Designers, Resellers)
    // 🔒 SECURITY: Escape regex special characters to prevent injection
    const escapedName = trimmedFullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegex = new RegExp(`^${escapedName}$`, 'i'); // Case-insensitive exact match

    const existingUser = await User.findOne({ $or: [{ email: trimmedEmail }, { phone: trimmedPhone }, { fullName: nameRegex }] });

    if (existingUser) {
      // Check Name
      const nameTaken =
        (existingUser && existingUser.fullName.toLowerCase() === trimmedFullName.toLowerCase());

      if (nameTaken) {
        return res.status(400).json({ error: 'This name is already taken. Please try a different name.' });
      }

      // 🔒 SECURITY: Generic error to prevent email/phone enumeration
      // Don't reveal whether email or phone specifically exists
      return res.status(400).json({ error: 'An account with these details already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user object
    const userData = {
      fullName: trimmedFullName,
      email: trimmedEmail,
      password: hashedPassword,
      phone: trimmedPhone,
    };

    // Create user
    const user = new User(userData);
    await user.save();

    // Return success response without password
    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    // Handle duplicate key error (MongoDB unique constraint) - Fixed: removed CNIC reference
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      let message = 'This value is already registered.';

      if (field === 'email') {
        message = 'Email is already registered.';
      } else if (field === 'phone') {
        message = 'Phone number is already registered.';
      }

      return res.status(400).json({ error: message });
    }

    // Handle bcrypt errors
    if (err.name === 'Error' && err.message.includes('bcrypt')) {
      return res.status(500).json({ error: 'Password processing failed. Please try again.' });
    }

    // Log unexpected errors for debugging
    console.error('User registration error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });

    // Pass to global error handler
    next(err);
  }
};

// Get user profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// Update user profile
export const updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if phone number is already taken by another user
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({
        phone: phone,
        _id: { $ne: user._id }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Phone number is already taken.' });
      }
    }

    // Update fields
    if (fullName) user.fullName = sanitizeString(fullName);
    if (phone) {
      if (!/^03\d{9}$/.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 11-digit phone number (e.g., 03123456789)' });
      }
      user.phone = phone;
    }

    if (req.body.address) user.address = sanitizeString(req.body.address);
    if (req.body.location) user.location = sanitizeString(req.body.location);

    // Handle profile image upload
    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        location: user.location,
        profileImage: user.profileImage,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (err) {
    next(err);
  }
};
