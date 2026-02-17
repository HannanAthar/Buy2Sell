
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Reseller from '../models/Reseller.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path for safety in this environment
dotenv.config({ path: 'D:\\Buy2Sell\\backend\\.env' });

const findProductOwner = async () => {
    try {
        if (!process.env.MONGO_CONN) {
            throw new Error('MONGO_CONN is undefined. Check .env path.');
        }
        await mongoose.connect(process.env.MONGO_CONN);
        console.log('✅ Connected to MongoDB');

        const productName = "fd";
        console.log(`🔎 Searching for product: "${productName}"`);

        const product = await Product.findOne({ name: productName });

        if (!product) {
            console.log(`❌ Product "${productName}" not found.`);
            return;
        }

        console.log(`📦 Found Product:`);
        console.log(`   - Name: ${product.name}`);
        console.log(`   - ID: ${product._id}`);
        console.log(`   - Seller ID: ${product.sellerId}`);
        console.log(`   - Seller Name (in product): ${product.sellerName}`);
        console.log(`   - Seller Type: ${product.sellerType}`);

        // Find the reseller details
        const reseller = await Reseller.findById(product.sellerId);
        if (reseller) {
            console.log(`\n👤 Owner Details (Reseller):`);
            console.log(`   - Name: ${reseller.fullName}`);
            console.log(`   - Email: ${reseller.email}`);
            console.log(`   - ID: ${reseller._id}`);
        } else {
            console.log(`\n⚠️ Owner not found in Reseller collection!`);
        }

        // Compare with the "Nabeeha Batool" ID we found earlier
        const knownId = "68fe8584cf1a87091792cc78";
        if (product.sellerId.toString() !== knownId) {
            console.log(`\n⚠️ MISMATCH DETECTED!`);
            console.log(`   The product "fd" belongs to ${product.sellerId}`);
            console.log(`   But the other products belong to ${knownId}`);
            console.log(`   The user is logged in as the owner of "fd".`);
        } else {
            console.log(`\n✅ ID Matches known Nabeeha Batool ID.`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

findProductOwner();
