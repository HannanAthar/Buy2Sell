import Reseller from '../models/Reseller.js';
import User from '../models/User.js';
import Designer from '../models/Designer.js';
import bcrypt from 'bcrypt';
import Product from '../models/Product.js';
import { sanitizeString } from '../utils/sanitize.js';



export const registerReseller = async (req, res) => {
  try {
    console.log('📝 Reseller registration request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const {
      fullName, email, password, confirmPassword, phone, location, address, bio,
      paymentMethod, accountName, accountNumber,
      bankName, bankAccountTitle, bankAccountNumber, bankIban
    } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !phone || !bio || !paymentMethod || (!location && !address)) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }
    // Logo is optional now
    // if (!req.files || !req.files.logo) {
    //   return res.status(400).json({ error: 'Please upload a logo image.' });
    // }

    const t = (v = '') => sanitizeString(String(v));
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(t(email))) return res.status(400).json({ error: 'Invalid email format.' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters long.' });

    // Strict Phone Validation
    const phoneRegex = /^03\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit phone number (e.g., 03123456789)' });
    }
    const normalizedPhone = phone; // No +92 conversion

    // 🔥 GLOBAL UNIQUENESS CHECK (Name & Email across Users, Designers, Resellers)
    const emailCheck = t(email).toLowerCase();
    const nameCheck = t(fullName);
    const nameRegex = new RegExp(`^${nameCheck}$`, 'i'); // Case-insensitive exact match

    const existingUser = await User.findOne({ $or: [{ email: emailCheck }, { fullName: nameRegex }] });
    const existingDesigner = await Designer.findOne({ $or: [{ email: emailCheck }, { fullName: nameRegex }] });
    const existingReseller = await Reseller.findOne({ $or: [{ email: emailCheck }, { fullName: nameRegex }, { phone: normalizedPhone }] });

    if (existingUser || existingDesigner || existingReseller) {
      // Check if it was the name that matched
      const nameTaken =
        (existingUser && existingUser.fullName.toLowerCase() === nameCheck.toLowerCase()) ||
        (existingDesigner && existingDesigner.fullName.toLowerCase() === nameCheck.toLowerCase()) ||
        (existingReseller && existingReseller.fullName.toLowerCase() === nameCheck.toLowerCase());

      if (nameTaken) {
        return res.status(400).json({ error: 'Try different name...this name is already taken' });
      }

      // Check if it was the email that matched
      const emailTaken =
        (existingUser && existingUser.email === emailCheck) ||
        (existingDesigner && existingDesigner.email === emailCheck) ||
        (existingReseller && existingReseller.email === emailCheck);

      if (emailTaken) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }

      // Fallback for phone (Reseller check above included phone)
      if (existingReseller && existingReseller.phone === normalizedPhone) {
        return res.status(400).json({ error: 'Phone number is already registered.' });
      }

      return res.status(400).json({ error: 'Account with these details already exists.' });
    }

    let logoPath = '/placeholder.svg';
    if (req.files && req.files.logo) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(req.files.logo[0].mimetype)) {
        return res.status(400).json({ error: 'Logo must be a valid image file.' });
      }
      logoPath = `/uploads/${req.files.logo[0].filename}`;
    }

    const hashed = await bcrypt.hash(password, 12);

    const reseller = new Reseller({
      fullName: t(fullName),
      email: t(email).toLowerCase(),
      password: hashed,
      phone: normalizedPhone,
      location: t(location || address),
      address: t(address),
      bio: t(bio),
      logo: logoPath,
      paymentMethod,
      paymentDetails:
        (paymentMethod === 'JazzCash' || paymentMethod === 'EasyPaisa')
          ? { accountName: t(accountName), accountNumber: t(accountNumber) }
          : {
            bankName: t(bankName),
            bankAccountTitle: t(bankAccountTitle),
            bankAccountNumber: t(bankAccountNumber),
            bankIban: bankIban ? t(bankIban).toUpperCase() : undefined
          }
    });

    await reseller.save();

    console.log('✅ Reseller registered successfully:', reseller._id);

    // Send proper JSON response with correct status code
    return res.status(201).json({
      success: true,
      message: 'Reseller registered successfully!',
      reseller: {
        id: reseller._id,
        fullName: reseller.fullName,
        email: reseller.email,
        phone: reseller.phone,
        location: reseller.location,
        bio: reseller.bio,
        paymentMethod: reseller.paymentMethod,
        paymentDetails: reseller.paymentDetails,
        logo: reseller.logo,
        createdAt: reseller.createdAt
      }
    });
  } catch (err) {
    console.error('❌ Reseller registration error:', err);

    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return res.status(400).json({
        error: field === 'email' ? 'Email is already registered.' : 'Phone number is already registered.'
      });
    }

    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// Get reseller profile
export const getResellerProfile = async (req, res) => {
  try {
    const reseller = await Reseller.findById(req.user._id).select('-password');
    if (!reseller) return res.status(404).json({ error: 'Reseller not found.' });
    res.json({ success: true, reseller });
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving profile.' });
  }
};

// Update reseller profile
export const updateResellerProfile = async (req, res) => {
  try {
    const reseller = await Reseller.findById(req.user._id);
    if (!reseller) return res.status(404).json({ error: 'Reseller not found.' });

    const {
      fullName, phone, location, bio,
      paymentMethod, accountName, accountNumber,
      bankName, bankAccountTitle, bankAccountNumber, bankIban
    } = req.body;

    // Basic fields
    if (fullName) reseller.fullName = sanitizeString(fullName);
    if (phone) {
      if (!/^03\d{9}$/.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 11-digit phone number (e.g., 03123456789)' });
      }
      reseller.phone = phone;
    }
    if (location) reseller.location = sanitizeString(location);
    if (bio) reseller.bio = sanitizeString(bio);
    if (req.body.address) reseller.address = sanitizeString(req.body.address);

    // Payment fields
    if (paymentMethod) reseller.paymentMethod = paymentMethod;

    // Update payment details map based on method (or just update all if provided)
    if (!reseller.paymentDetails) reseller.paymentDetails = {};

    let paymentUpdated = false;

    if (accountName) { reseller.paymentDetails.accountName = sanitizeString(accountName); paymentUpdated = true; }
    if (accountNumber) { reseller.paymentDetails.accountNumber = sanitizeString(accountNumber); paymentUpdated = true; }

    if (bankName) { reseller.paymentDetails.bankName = sanitizeString(bankName); paymentUpdated = true; }
    if (bankAccountTitle) { reseller.paymentDetails.bankAccountTitle = sanitizeString(bankAccountTitle); paymentUpdated = true; }
    if (bankAccountNumber) { reseller.paymentDetails.bankAccountNumber = sanitizeString(bankAccountNumber); paymentUpdated = true; }
    if (bankIban) { reseller.paymentDetails.bankIban = sanitizeString(bankIban).toUpperCase(); paymentUpdated = true; }

    // Clean up incompatible fields based on method if switching
    if (paymentMethod === 'JazzCash' || paymentMethod === 'EasyPaisa') {
      reseller.paymentDetails.bankName = undefined;
      reseller.paymentDetails.bankAccountTitle = undefined;
      reseller.paymentDetails.bankAccountNumber = undefined;
      reseller.paymentDetails.bankIban = undefined;
    } else if (paymentMethod === 'Bank Transfer') {
      reseller.paymentDetails.accountName = undefined;
      reseller.paymentDetails.accountNumber = undefined;
    }

    // Reset payout status if payment details changed
    if (paymentMethod || paymentUpdated) {
      reseller.payoutStatus = 'pending';
      reseller.payoutRejectionReason = '';
    }

    if (req.files && req.files.logo) {
      reseller.logo = `/uploads/${req.files.logo[0].filename}`;
    }

    await reseller.save();

    // 🔥 TASK 1 FIX: Propagate name change to all existing products
    if (fullName) {
      await Product.updateMany(
        { sellerId: reseller._id, sellerType: 'Reseller' },
        { $set: { sellerName: sanitizeString(fullName) } }
      );
      console.log(`✅ Updated products for Reseller ${reseller._id} to new name: ${fullName}`);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      reseller: {
        id: reseller._id,
        fullName: reseller.fullName,
        email: reseller.email,
        phone: reseller.phone,
        location: reseller.location,
        address: reseller.address,
        bio: reseller.bio,
        paymentMethod: reseller.paymentMethod,
        paymentDetails: reseller.paymentDetails,
        logo: reseller.logo
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
};