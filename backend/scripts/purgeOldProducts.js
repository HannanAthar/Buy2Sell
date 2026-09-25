/**
 * purgeOldProducts.js
 * 
 * One-time migration script to permanently delete all products that belong to
 * legacy "Designer" or "Reseller" seller types from MongoDB.
 * 
 * Usage: node backend/scripts/purgeOldProducts.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

dotenv.config({ path: './backend/.env' });

const MONGO_URI = process.env.MONGO_CONN || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI environment variable is not set. Please check backend/.env');
  process.exit(1);
}

const runPurge = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    // Count before deletion
    const beforeCount = await Product.countDocuments({
      sellerType: { $in: ['Designer', 'Reseller', 'designer', 'reseller'] }
    });

    console.log(`\n📦 Found ${beforeCount} legacy Designer/Reseller products in the database.`);

    if (beforeCount === 0) {
      console.log('✅ No legacy products found. Database is already clean!');
    } else {
      console.log('🗑️  Deleting legacy products...');
      const result = await Product.deleteMany({
        sellerType: { $in: ['Designer', 'Reseller', 'designer', 'reseller'] }
      });

      console.log(`\n✅ PURGE COMPLETE! Deleted ${result.deletedCount} legacy products.`);
    }

    // Show remaining products
    const remaining = await Product.countDocuments();
    console.log(`\n📊 Remaining products in database: ${remaining}`);

    // Show breakdown by sellerType
    const breakdown = await Product.aggregate([
      { $group: { _id: '$sellerType', count: { $sum: 1 } } }
    ]);
    console.log('\n📋 Products by seller type:');
    breakdown.forEach(b => {
      console.log(`  ${b._id || 'undefined'}: ${b.count}`);
    });

  } catch (err) {
    console.error('❌ Error during purge:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB. Script complete.');
    process.exit(0);
  }
};

runPurge();
