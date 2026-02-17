import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Product from './models/Product.js';
import Review from './models/Review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env");

console.log("Reading .env manually from:", envPath);
try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
            process.env[key.trim()] = val;
        }
    }
} catch (e) {
    console.error("Failed to read .env:", e.message);
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONN);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const fixCounts = async () => {
    await connectDB();
    console.log("🚀 Starting System-Wide Review Count Reconciliation...");

    const products = await Product.find({});
    console.log(`📋 Found ${products.length} products to check.`);

    let fixedCount = 0;

    for (const product of products) {
        // Query for actual visible reviews
        // Assuming visible means isVisible is NOT false (true or undefined)
        const query = { product: product._id, isVisible: { $ne: false } };
        
        const actualCount = await Review.countDocuments(query);
        
        const agg = await Review.aggregate([
            { $match: query },
            { $group: { _id: null, avg: { $avg: "$rating" } } }
        ]);
        const actualAvg = agg.length > 0 ? agg[0].avg : 0;

        // Check for mismatch
        if (product.ratingCount !== actualCount || Math.abs(product.averageRating - actualAvg) > 0.1) {
            console.log(`⚠️  Mismatch ID: ${product._id}`);
            console.log(`    Stored: Count=${product.ratingCount}, Avg=${product.averageRating}`);
            console.log(`    Actual: Count=${actualCount}, Avg=${actualAvg.toFixed(2)}`);

            // Update
            product.ratingCount = actualCount;
            product.averageRating = actualAvg;
            await product.save();
            console.log(`    ✅ FIXED.`);
            fixedCount++;
        }
    }

    console.log(`\n🎉 Reconciliation Complete.`);
    console.log(`✅ Fixed ${fixedCount} products out of ${products.length}.`);
    process.exit();
};

fixCounts();
