import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import bcrypt from 'bcrypt';

dotenv.config({ path: './.env' });

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to DB');

    const email = 'test@example.com';
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('User already exists');
    } else {
      const password = await bcrypt.hash('password123', 10);
      user = new User({
        fullName: 'Test User',
        email,
        password,
        phone: '1234567890',
        location: 'Test Location',
        role: 'buyer' // Ensure role is buyer/user
      });
      await user.save();
      console.log('Test User Created');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createTestUser();
