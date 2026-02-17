import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js'; // Adjust path if needed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const debugImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to DB');

    const products = await Product.find({}).limit(5).select('name images');
    console.log('--- Product Images Debug ---');
    products.forEach(p => {
        console.log(`Product: ${p.name}`);
        console.log(`Images:`, p.images);
        if (p.images && p.images.length > 0) {
            console.log(`Expected URL: http://localhost:5000/uploads/${p.images[0]}`);
        }
        console.log('----------------');
    });

    // Search for "shoes" specifically
    const shoes = await Product.find({ name: /shoes/i }).limit(5).select('name images');
    if (shoes.length > 0) {
        console.log('--- Shoes specific Debug ---');
        shoes.forEach(p => {
             console.log(`Product: ${p.name}`);
             console.log(`Images:`, p.images);
        });
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

debugImages();
