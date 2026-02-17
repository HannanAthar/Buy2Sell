import Designer from '../models/Designer.js';
import User from '../models/User.js';
import Reseller from '../models/Reseller.js';
import bcrypt from 'bcrypt';
import Product from '../models/Product.js';
import { sanitizeString } from '../utils/sanitize.js';



export const registerDesigner = async (req, res) => {
  try {
    console.log('📝 Designer registration request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { fullName, email, password, confirmPassword, phone, location, address, bio } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !phone || !bio || (!location && !address)) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }

    // Payout Information Validation
    const { paymentMethod, accountName, accountNumber, bankName, bankAccountTitle, bankAccountNumber } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required.' });
    }

    if (paymentMethod === 'JazzCash' || paymentMethod === 'EasyPaisa') {
       if (!accountName || !accountNumber) {
         return res.status(400).json({ error: `Account Name and Number are required for ${paymentMethod}.` });
       }
    } else if (paymentMethod === 'Bank Transfer' || paymentMethod === 'BankAccount') {
       if (!bankName || !bankAccountTitle || !bankAccountNumber) {
         return res.status(400).json({ error: 'Bank Name, Title, and Account Number are required for Bank Transfer.' });
       }
    }

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
    const existingDesigner = await Designer.findOne({ $or: [{ email: emailCheck }, { fullName: nameRegex }, { phone: normalizedPhone }] });
    const existingReseller = await Reseller.findOne({ $or: [{ email: emailCheck }, { fullName: nameRegex }] });

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

      // Fallback for phone (Designer only check above included phone)
      if (existingDesigner && existingDesigner.phone === normalizedPhone) {
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

    const designer = new Designer({
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
            bankIban: req.body.bankIban ? t(req.body.bankIban).toUpperCase() : undefined
          },
     payoutStatus: 'pending' // Default for new signups
    });

    await designer.save();

    console.log('✅ Designer registered successfully:', designer._id);

    // Send proper JSON response with correct status code
    return res.status(201).json({
      success: true,
      message: 'Designer registered successfully!',
      designer: {
        id: designer._id,
        fullName: designer.fullName,
        email: designer.email,
        phone: designer.phone,
        location: designer.location,
        bio: designer.bio,
        logo: designer.logo,
        createdAt: designer.createdAt
      }
    });
  } catch (err) {
    console.error('❌ Designer registration error:', err);

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

export const uploadDesignerProduct = async (req, res) => {
  try {
    const designerId = req.user._id; // Get designer ID from authenticated user
    const designer = await Designer.findById(designerId);

    if (!designer) {
      return res.status(404).json({
        success: false,
        message: "Designer not found"
      });
    }

    const product = new Product({
      ...req.body,
      designer: {
        id: designer._id,
        name: designer.brandName || designer.name,
        logo: designer.logo
      },
      images: req.files ? req.files.map(file => file.path) : [],
      createdBy: designerId,
      productType: 'designer'
    });

    const savedProduct = await product.save();
    console.log('Saved product with designer:', savedProduct); // Debug log

    res.status(201).json({
      success: true,
      product: savedProduct
    });
  } catch (error) {
    console.error('Designer upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get designer profile
export const getDesignerProfile = async (req, res) => {
  try {
    const designer = await Designer.findById(req.user._id).select('-password');
    if (!designer) return res.status(404).json({ error: 'Designer not found.' });
    res.json({ success: true, designer });
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving profile.' });
  }
};

// Update designer profile
export const updateDesignerProfile = async (req, res) => {
  try {
    const designer = await Designer.findById(req.user._id);
    if (!designer) return res.status(404).json({ error: 'Designer not found.' });

    const { fullName, phone, location, bio } = req.body;

    if (fullName) designer.fullName = sanitizeString(fullName);
    if (phone) {
      if (!/^03\d{9}$/.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 11-digit phone number (e.g., 03123456789)' });
      }
      designer.phone = phone;
    }

    if (location) designer.location = sanitizeString(location);
    if (bio) designer.bio = sanitizeString(bio);
    if (req.body.address) designer.address = sanitizeString(req.body.address);

    // Payment fields
    if (req.body.paymentMethod) designer.paymentMethod = req.body.paymentMethod;

    // Update payment details map based on method (or just update all if provided)
    if (!designer.paymentDetails) designer.paymentDetails = {};
    
    // Extract payment fields from body
    const { 
      accountName, accountNumber,
      bankName, bankAccountTitle, bankAccountNumber, bankIban 
    } = req.body;

    let paymentUpdated = false;

    if (accountName) { designer.paymentDetails.accountName = sanitizeString(accountName); paymentUpdated = true; }
    if (accountNumber) { designer.paymentDetails.accountNumber = sanitizeString(accountNumber); paymentUpdated = true; }

    if (bankName) { designer.paymentDetails.bankName = sanitizeString(bankName); paymentUpdated = true; }
    if (bankAccountTitle) { designer.paymentDetails.bankAccountTitle = sanitizeString(bankAccountTitle); paymentUpdated = true; }
    if (bankAccountNumber) { designer.paymentDetails.bankAccountNumber = sanitizeString(bankAccountNumber); paymentUpdated = true; }
    if (bankIban) { designer.paymentDetails.bankIban = sanitizeString(bankIban).toUpperCase(); paymentUpdated = true; }

    // Clean up incompatible fields based on method if switching
    if (designer.paymentMethod === 'JazzCash' || designer.paymentMethod === 'EasyPaisa') {
      designer.paymentDetails.bankName = undefined;
      designer.paymentDetails.bankAccountTitle = undefined;
      designer.paymentDetails.bankAccountNumber = undefined;
      designer.paymentDetails.bankIban = undefined;
    } else if (designer.paymentMethod === 'Bank Transfer') {
      designer.paymentDetails.accountName = undefined;
      designer.paymentDetails.accountNumber = undefined;
    }

    // Reset payout status if payment details changed
    if (req.body.paymentMethod || paymentUpdated) {
       designer.payoutStatus = 'pending';
       designer.payoutRejectionReason = ''; // Clear previous rejection reason
    }

    if (req.files && req.files.logo) {
      designer.logo = `/uploads/${req.files.logo[0].filename}`;
    }

    await designer.save();

    // 🔥 TASK 1 FIX: Propagate name change to all existing products
    if (fullName) {
      await Product.updateMany(
        { sellerId: designer._id, sellerType: 'Designer' },
        { $set: { sellerName: sanitizeString(fullName) } }
      );
      console.log(`✅ Updated products for Designer ${designer._id} to new name: ${fullName}`);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      designer: {
        id: designer._id,
        fullName: designer.fullName,
        email: designer.email,
        phone: designer.phone,
        location: designer.location,
        address: designer.address,
        bio: designer.bio,
        paymentMethod: designer.paymentMethod,
        paymentDetails: designer.paymentDetails,
        logo: designer.logo
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
};