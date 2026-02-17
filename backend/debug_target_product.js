import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const debugProduct = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('Connected to DB');

    const products = await Product.find({ name: /joggers/i });
    if (products.length > 0) {
        products.forEach(p => {
             console.log(`Product: "${p.name}"`);
             console.log(`Images:`, p.images);
        });
    } else {
        console.log("No products matching /joggers/i found");
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

debugProduct();
