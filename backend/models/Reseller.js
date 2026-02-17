import mongoose from 'mongoose';

const paymentDetailsSchema = new mongoose.Schema({
  accountName: String,
  accountNumber: String,
  bankName: String,
  bankAccountTitle: String,
  bankAccountNumber: String,
  bankIban: String
}, { _id: false });

const resellerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Provide valid email'] },
  password: { type: String, required: true, minlength: 8 },

  // Strict 11-digit Phone Validation (03XXXXXXXXX)
  phone: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: v => /^03\d{9}$/.test(String(v || '').trim()),
      message: 'Please enter a valid 11-digit phone number starting with 03'
    }
  },

  location: { type: String, trim: true },
  address: { type: String, trim: true, default: '' },
  bio: { type: String, required: true, maxlength: 500 },
  logo: { type: String, required: false },
  paymentMethod: { type: String, required: true, enum: ['JazzCash', 'EasyPaisa', 'BankAccount'] },
  paymentDetails: { type: paymentDetailsSchema, required: true },
  payoutStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  payoutRejectionReason: { type: String },
  role: { type: String, enum: ['reseller'], default: 'reseller' },
  isActive: { type: Boolean, default: true },

  // Password Reset Fields
  resetCodeHash: { type: String },
  resetCodeExpiry: { type: Date },
  resetAttempts: { type: Number, default: 0 },
  resetRequestedAt: { type: Date },
  passwordChangedAt: { type: Date },
  tokenVersion: { type: Number, default: 0 },

  // 🔒 SECURITY: Account Lockout Fields
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },

  lastLogin: Date,
  lastActivity: { type: Date, default: Date.now },

  // Ratings
  averageRating: { type: Number, default: 0, index: true },
  ratingCount: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  // Stripe Connect account for escrow payouts
  stripeConnectAccountId: { type: String, default: null },
  stripeConnectAccountStatus: {
    type: String,
    enum: [null, "pending", "restricted", "enabled"],
    default: null
  },
}, { timestamps: true });

// Normalization removed to strictly enforce 03XXXXXXXXX format
// resellerSchema.pre('validate', function (next) {
//   if (this.phone) this.phone = normalizePkPhone(this.phone);
//   next();
// });

export default mongoose.model('Reseller', resellerSchema);
