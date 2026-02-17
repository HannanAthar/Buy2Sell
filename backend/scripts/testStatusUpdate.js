
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path for safety in this environment
dotenv.config({ path: 'D:\\Buy2Sell\\backend\\.env' });

const listResellerProducts = async () => {
    try {
        if (!process.env.MONGO_CONN) {
            throw new Error('MONGO_CONN is undefined. Check .env path.');
        }
        await mongoose.connect(process.env.MONGO_CONN);
        console.log('✅ Connected to MongoDB');

        // 1. Find the reseller from the screenshot (Nabeeha Batool)
        // We can search by sellerName in products to find their ID
        const sellerName = "Nabeeha Batool";
        console.log(`🔎 Searching for products by seller: "${sellerName}"`);

        const products = await Product.find({ sellerName: sellerName });

        if (products.length === 0) {
            console.log(`❌ No products found for seller "${sellerName}".`);
            // Try partial match
            const partial = await Product.find({ sellerName: { $regex: "Nabeeha", $options: "i" } });
            console.log(`ℹ️ Found ${partial.length} products with partial name match "Nabeeha".`);
            partial.forEach(p => console.log(`   - ${p.name} (ID: ${p._id}, Status: ${p.status})`));
            return;
        }

        console.log(`📦 Found ${products.length} products for "${sellerName}":`);
        products.forEach(p => {
            console.log(`   - [${p.status}] ${p.name} (ID: ${p._id})`);
            console.log(`     Image: ${p.images?.[0]}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

listResellerProducts();
