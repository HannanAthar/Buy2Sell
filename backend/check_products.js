import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_CONN || process.env.MONGO_URI;

async function checkProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    // Count by status
    const total = await collection.countDocuments();
    const approved = await collection.countDocuments({ status: 'approved' });
    const pending = await collection.countDocuments({ status: 'pending' });
    const active = await collection.countDocuments({ isActive: true });
    const approvedActive = await collection.countDocuments({ status: 'approved', isActive: true });

    console.log('\n📊 PRODUCT STATISTICS:');
    console.log(`Total products: ${total}`);
    console.log(`Approved: ${approved}`);
    console.log(`Pending: ${pending}`);
    console.log(`Active: ${active}`);
    console.log(`Approved + Active (visible): ${approvedActive}`);

    // Count by sellerType
    const designers = await collection.countDocuments({ sellerType: 'Designer', status: 'approved', isActive: true });
    const resellers = await collection.countDocuments({ sellerType: 'Reseller', status: 'approved', isActive: true });
    const admins = await collection.countDocuments({ sellerType: 'Admin', status: 'approved', isActive: true });

    console.log('\n📊 BY SELLER TYPE (approved + active):');
    console.log(`Designers: ${designers}`);
    console.log(`Resellers: ${resellers}`);
    console.log(`Admin/Custom: ${admins}`);

    // Sample a few products
    const sample = await collection.find({ status: 'approved', isActive: true }).limit(3).toArray();
    console.log('\n📦 Sample approved products:');
    sample.forEach(p => {
      console.log(`  - ${p.name} | sellerType: ${p.sellerType} | status: ${p.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProducts();
