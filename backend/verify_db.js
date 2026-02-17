import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Designer from './models/Designer.js';
import Reseller from './models/Reseller.js';

dotenv.config({ path: './.env' });

const verifyUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to DB');

    const email = 'test@example.com';
    let user = await User.findOne({ email });
    if (user) console.log('Found in User:', user.resetCodeHash ? 'Has Reset Hash' : 'No Hash');

    user = await Designer.findOne({ email });
    if (user) console.log('Found in Designer:', user.resetCodeHash ? 'Has Reset Hash' : 'No Hash');

    user = await Reseller.findOne({ email });
    if (user) console.log('Found in Reseller:', user.resetCodeHash ? 'Has Reset Hash' : 'No Hash');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verifyUser();
