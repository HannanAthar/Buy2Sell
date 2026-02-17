import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to MongoDB');

    const Admin = mongoose.model('Admin', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      isActive: Boolean,
      lastLogin: Date
    }, { timestamps: true }));

    const existing = await Admin.findOne({ email: 'admin@buy2sell.com' });
    if (existing) {
      console.log('Admin already exists!');
      console.log('Email: admin@buy2sell.com');
      console.log('Try your password or delete this admin and run again');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@buy2sell.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      lastLogin: new Date()
    });

    console.log('Admin created successfully!');
    console.log('');
    console.log('Email: admin@buy2sell.com');
    console.log('Password: Admin123!');
    console.log('');
    console.log('IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('Now you can login at: http://localhost:5173/admin/login');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();