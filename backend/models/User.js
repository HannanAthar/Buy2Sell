import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters']
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },

  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    // Strict 11-digit Phone Validation (03XXXXXXXXX)
    match: [/^03\d{9}$/, 'Please enter a valid 11-digit phone number starting with 03']
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  profileImage: {
    type: String,
    default: ''
  },

  role: {
    type: String,
    enum: ['buyer'],
    default: 'buyer'
  },

  // Profile fields
  location: {
    type: String,
    trim: true,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },

  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },

  // Password Reset Fields
  resetCodeHash: String,
  resetCodeExpiry: Date,
  resetRequestedAt: Date,
  resetAttempts: { type: Number, default: 0 },
  passwordChangedAt: Date,
  tokenVersion: { type: Number, default: 0 },

  // 🔒 SECURITY: Account Lockout Fields
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);