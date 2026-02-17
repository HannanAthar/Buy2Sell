// backend/scripts/deleteCustomProducts.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_CONN || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_CONN not found in env");
  process.exit(1);
}

// Product names to delete (from the seed script)
const productNamesToDelete = [
  "Cotton Tee",
  "Hoodie", 
  "Baggy Tee",
  "Long Sleeve"
];

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete products that match the seeded items
    const result = await Product.deleteMany({
      name: { $in: productNamesToDelete },
      sellerName: "Abeeha" // Target only those assigned to this designer
    });

    console.log(`🗑️  Deleted ${result.deletedCount} custom products`);
    console.log('✅ Cleanup complete!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  }
}

cleanup();
