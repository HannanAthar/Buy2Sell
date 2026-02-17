import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const checkImages = async () => {
  try {
    const mongoUri = process.env.MONGO_CONN || process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_CONN not found in .env");

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  
    const products = await Product.find().sort({ createdAt: -1 }).limit(1);
    
    console.log('\n=== CHECKING LATEST 10 PRODUCTS ===\n');
    
    if (products.length === 0) {
        console.log("No products found.");
    }

    products.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name} (ID: ${product._id})`);
      if (product.images && product.images.length > 0) {
          product.images.forEach((img, i) => {
              console.log(`  Image ${i+1}: ${img}`);
              console.log(`  - Starts with http: ${img.startsWith('http')}`);
              console.log(`  - Contains cloudinary: ${img.includes('cloudinary')}`);
          });
      } else {
          console.log("  No images");
      }
      console.log('---\n');
    });
    
  } catch (err) {
      console.error("Error:", err);
  } finally {
      mongoose.disconnect();
  }
};

checkImages();
