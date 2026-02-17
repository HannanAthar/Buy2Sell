import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Designer from './models/Designer.js';
import Reseller from './models/Reseller.js';
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

const fixSellerCounts = async () => {
    await connectDB();
    console.log("🚀 Starting Designer & Reseller Review Reconciliation...");

    // 1. Fix Designers
    const designers = await Designer.find({});
    console.log(`📋 Checking ${designers.length} Designers...`);
    
    for (const d of designers) {
        const query = { designer: d._id, isVisible: { $ne: false } };
        const count = await Review.countDocuments(query);
        const agg = await Review.aggregate([
            { $match: query },
            { $group: { _id: null, avg: { $avg: "$rating" } } }
        ]);
        const avg = agg.length > 0 ? agg[0].avg : 0;
        
        // Count reviews with text comments (for 'totalReviews' vs 'ratingCount')
        const reviewsWithComments = await Review.countDocuments({ 
            designer: d._id, 
            isVisible: { $ne: false }, 
            comment: { $exists: true, $ne: "" } 
        });

        // Use standard logic: ratingCount = total ratings, totalReviews = text reviews (or depends on schema usage)
        // In previous controller viewing: 
        // totalReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;
        // ratingCount = reviews.length;

        if (d.ratingCount !== count || Math.abs(d.averageRating - avg) > 0.1 || d.totalReviews !== reviewsWithComments) {
            console.log(`⚠️  Mismatch Designer: ${d.fullName} (${d._id})`);
            console.log(`    Stored: Count=${d.ratingCount}, Avg=${d.averageRating}, Text=${d.totalReviews}`);
            console.log(`    Actual: Count=${count}, Avg=${avg.toFixed(2)}, Text=${reviewsWithComments}`);
            
            d.ratingCount = count;
            d.averageRating = avg;
            d.totalReviews = reviewsWithComments;
            await d.save();
            console.log('    ✅ FIXED.');
        }
    }

    // 2. Fix Resellers
    const resellers = await Reseller.find({});
    console.log(`📋 Checking ${resellers.length} Resellers...`);

    for (const r of resellers) {
        const query = { reseller: r._id, isVisible: { $ne: false } };
        const count = await Review.countDocuments(query);
        const agg = await Review.aggregate([
            { $match: query },
            { $group: { _id: null, avg: { $avg: "$rating" } } }
        ]);
        const avg = agg.length > 0 ? agg[0].avg : 0;
        
        const reviewsWithComments = await Review.countDocuments({ 
            reseller: r._id, 
            isVisible: { $ne: false }, 
            comment: { $exists: true, $ne: "" } 
        });

        if (r.ratingCount !== count || Math.abs(r.averageRating - avg) > 0.1 || r.totalReviews !== reviewsWithComments) {
            console.log(`⚠️  Mismatch Reseller: ${r.fullName} (${r._id})`);
            console.log(`    Stored: Count=${r.ratingCount}, Avg=${r.averageRating}, Text=${r.totalReviews}`);
            console.log(`    Actual: Count=${count}, Avg=${avg.toFixed(2)}, Text=${reviewsWithComments}`);
            
            r.ratingCount = count;
            r.averageRating = avg;
            r.totalReviews = reviewsWithComments;
            await r.save();
            console.log('    ✅ FIXED.');
        }
    }

    console.log("\n🎉 Reconciliation Complete.");
    process.exit();
};

fixSellerCounts();
