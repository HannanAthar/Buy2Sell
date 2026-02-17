import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const sign = (admin) =>
  jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

export const adminLogin = async (req, res) => {
  try {
    console.log('🔐 Admin login attempt');
    console.log('📧 Request body:', req.body);

    const { email, password } = req.body || {};
    
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ message: "Email & password required" });
    }

    console.log('🔍 Looking for admin:', email);
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log('✅ Admin found:', admin.email);
    console.log('🔑 Checking password...');

    // Check if comparePassword method exists
    if (typeof admin.comparePassword !== 'function') {
      console.log('❌ comparePassword method not found on admin model');
      return res.status(500).json({ message: "Server configuration error" });
    }

    const isMatch = await admin.comparePassword(password);
    console.log('🎯 Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!admin.isActive) {
      console.log('❌ Admin account disabled');
      return res.status(403).json({ message: "Admin disabled" });
    }

    console.log('✅ Admin authenticated, updating lastLogin');
    admin.lastLogin = new Date();
    await admin.save();

    const token = sign(admin);
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    res.json({
      token,
      admin: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email, 
        role: "admin" 
      },
    });
  } catch (e) {
    console.error('❌ Admin login error:', e);
    res.status(500).json({ message: "Login failed", error: e.message });
  }
};