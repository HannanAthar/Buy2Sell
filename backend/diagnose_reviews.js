import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from './models/Product.js';
import Review from './models/Review.js';
import Designer from './models/Designer.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, ".env");

console.log("Reading .env manually from:", envPath);
try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const val = valueParts.join('=').trim().replace(/^["']|["']$/g, ''); // Basic dequote
            process.env[key.trim()] = val;
        }
    }
    console.log("Keys found in .env:", Object.keys(process.env).filter(k => !process.env[k]?.includes('Program'))); // Filter simplistic system vars
} catch (e) {
    console.error("Failed to read .env:", e.message);
}

console.log("MONGO_CONN defined:", !!process.env.MONGO_CONN);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONN);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const diagnoseProduct = async (productName) => {
    console.log(`\n--- Diagnosing: "${productName}" ---`);
    const product = await Product.findOne({
        $or: [
            { name: { $regex: productName, $options: 'i' } },
            { title: { $regex: productName, $options: 'i' } }
        ]
    });

    if (!product) {
        console.log('❌ Product not found');
        return;
    }

    console.log(`✅ Found Product ID: ${product._id}`);
    console.log(`   Seller: ${product.sellerName} (${product.sellerType})`);
    console.log('--- Product Metadata (Stored) ---');
    console.log(`   ratingCount: ${product.ratingCount}`);
    console.log(`   averageRating: ${product.averageRating}`);
    console.log(`   reviews array length: ${product.reviews?.length || 0}`);

    console.log('--- Review Collection Analysis (Real-time) ---');
    
    // 1. Total Reviews (Any status)
    const totalReviews = await Review.countDocuments({ product: product._id });
    console.log(`   Total Documents in 'reviews' collection: ${totalReviews}`);

    // 2. Visible Reviews (The "Correct" Count)
    // Assuming visible means: NOT deleted AND (isVisible is true OR isVisible is undefined/missing - wait, strict check?)
    // Let's check exactly what the controller uses: { product: productId, isVisible: { $ne: false } }
    const visibleQuery = { product: product._id, isVisible: { $ne: false } };
    const visibleReviews = await Review.countDocuments(visibleQuery);
    console.log(`   Visible Reviews (isVisible != false): ${visibleReviews}  <-- SHOULD MATCH ratingCount`);

    // 3. Hidden Reviews
    const hiddenReviews = await Review.countDocuments({ product: product._id, isVisible: false });
    console.log(`   Hidden Reviews (isVisible == false): ${hiddenReviews}`);

    // Break discrepancies
    if (product.ratingCount !== visibleReviews) {
        console.log(`❌ DISCREPANCY DETECTED! Stored (${product.ratingCount}) != Actual Visible (${visibleReviews})`);
    } else {
        console.log(`✅ Counts Match.`);
    }

    // Check Reviews content briefly
    const reviews = await Review.find({ product: product._id });
    console.log('   Review details:', reviews.map(r => ({ id: r._id, val: r.rating, vis: r.isVisible, user: r.user })));
};

const runDiagnosis = async () => {
    await connectDB();

    await diagnoseProduct("Royal Embroidered Luxury Long Shirt");
    await diagnoseProduct("Premium Leather Everyday Carry Bag");

    console.log('\n--- Diagnosis Complete ---');
    process.exit();
};

runDiagnosis();
