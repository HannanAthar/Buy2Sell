import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Provide valid email"]
    },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin"], default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    console.log('⏭️  Password not modified, skipping hash');
    return next();
  }
  
  console.log('🔐 Hashing password for admin:', this.email);
  this.password = await bcrypt.hash(this.password, 10);
  console.log('✅ Password hashed successfully');
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (plainPassword) {
  console.log('🔍 Comparing passwords for:', this.email);
  console.log('📝 Plain password provided:', plainPassword ? 'Yes' : 'No');
  console.log('🔐 Stored hash:', this.password ? 'Exists' : 'Missing');
  
  try {
    const isMatch = await bcrypt.compare(plainPassword, this.password);
    console.log('✅ Comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    return false;
  }
};

export default mongoose.model("Admin", adminSchema);