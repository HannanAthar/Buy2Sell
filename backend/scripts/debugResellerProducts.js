
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

const debugResellerProducts = async () => {
    try {
        if (!process.env.MONGO_CONN) {
            throw new Error('MONGO_CONN is undefined. Check .env path.');
        }
        await mongoose.connect(process.env.MONGO_CONN);
        console.log('✅ Connected to MongoDB');

        const targetName = "Nabeeha Batool";
        console.log(`🔎 Investigating data for: "${targetName}"`);

        // 1. Find all Resellers with this name
        const resellers = await Reseller.find({
            $or: [
                { fullName: { $regex: targetName, $options: 'i' } },
                { name: { $regex: targetName, $options: 'i' } } // in case schema differs
            ]
        });

        console.log(`\n👥 Found ${resellers.length} Reseller account(s):`);
        resellers.forEach(r => {
            console.log(`   - ID: ${r._id}`);
            console.log(`     Name: ${r.fullName}`);
            console.log(`     Email: ${r.email}`);
            console.log(`     Created: ${r.createdAt}`);
        });

        // 2. Find all Products with this sellerName
        const products = await Product.find({
            sellerName: { $regex: targetName, $options: 'i' }
        });

        console.log(`\n📦 Found ${products.length} Product(s) with sellerName "${targetName}":`);

        // Group by sellerId
        const bySellerId = {};
        products.forEach(p => {
            const sid = p.sellerId.toString();
            if (!bySellerId[sid]) bySellerId[sid] = [];
            bySellerId[sid].push(p);
        });

        Object.keys(bySellerId).forEach(sid => {
            console.log(`\n   👉 Seller ID: ${sid}`);
            // Check if this ID matches any of the found resellers
            const owner = resellers.find(r => r._id.toString() === sid);
            if (owner) {
                console.log(`      (Matches Reseller: ${owner.fullName})`);
            } else {
                console.log(`      (⚠️ NO MATCHING RESELLER FOUND - ORPHANED?)`);
            }

            console.log(`      Products: ${bySellerId[sid].length}`);
            bySellerId[sid].forEach(p => {
                console.log(`        - [${p.status}] ${p.name} (ID: ${p._id})`);
                console.log(`          Type: ${p.sellerType}`);
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected');
    }
};

debugResellerProducts();
