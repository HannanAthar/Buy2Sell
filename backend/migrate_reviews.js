import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Review from './models/Review.js';
import Product from './models/Product.js';
import Reseller from './models/Reseller.js';
import Designer from './models/Designer.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const migrateReviews = async () => {
  try {
    if (!process.env.MONGO_CONN) {
        throw new Error("MONGO_CONN not defined in .env");
    }
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('✅ Connected to MongoDB');

    // 1. Find orphans
    const orphans = await Review.find({ reseller: null, designer: null }).populate('product');
    const affectedResellerIds = new Set();
    const affectedDesignerIds = new Set();
    let updatedCount = 0;

    console.log(`Scanning ${orphans.length} potential orphans...`);

    for (const review of orphans) {
        if (review.product && review.product.sellerType === 'Reseller') {
            const resellerId = review.product.sellerId;
            
            // Update Review
            review.reseller = resellerId;
            await review.save();
            
            affectedResellerIds.add(resellerId.toString());
            updatedCount++;
            console.log(`   -> Fixed review ${review._id} for Reseller ${resellerId}`);
            updatedCount++;
            console.log(`   -> Fixed review ${review._id} for Reseller ${resellerId}`);
        } else if (review.product && review.product.sellerType === 'Designer') {
            const designerId = review.product.sellerId;
            
            // Update Review
            review.designer = designerId;
            await review.save();
            
            affectedDesignerIds.add(designerId.toString());
            updatedCount++;
            console.log(`   -> Fixed review ${review._id} for Designer ${designerId}`);
        }
    }

    console.log(`Updated ${updatedCount} reviews.`);
    console.log(`Recalculating stats for ${affectedResellerIds.size} resellers...`);

    // 2. Recalculate stats for affected resellers
    for (const resellerIdStr of affectedResellerIds) {
        const resellerId = new mongoose.Types.ObjectId(resellerIdStr);
        
        // Find all reviews for this reseller
        const reviews = await Review.find({ reseller: resellerId });
        
        const count = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = count > 0 ? sum / count : 0;
        const totalReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;

        await Reseller.findByIdAndUpdate(resellerId, {
            averageRating: avg,
            ratingCount: count,
            totalReviews: totalReviews
        });
        
        console.log(`   -> Updated Reseller ${resellerId}: Avg ${avg.toFixed(1)} | Count ${count} | Reviews ${totalReviews}`);
        console.log(`   -> Updated Reseller ${resellerId}: Avg ${avg.toFixed(1)} | Count ${count} | Reviews ${totalReviews}`);
    }

    console.log(`Recalculating stats for ${affectedDesignerIds.size} designers...`);
    for (const designerIdStr of affectedDesignerIds) {
        const designerId = new mongoose.Types.ObjectId(designerIdStr);
        
        const reviews = await Review.find({ designer: designerId });
        
        const count = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = count > 0 ? sum / count : 0;
        const totalReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0).length;

        await Designer.findByIdAndUpdate(designerId, {
            averageRating: avg,
            ratingCount: count,
            totalReviews: totalReviews
        });
        
        console.log(`   -> Updated Designer ${designerId}: Avg ${avg.toFixed(1)} | Count ${count} | Reviews ${totalReviews}`);
    }

    console.log('🎉 Migration Complete!');

  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected');
  }
};

migrateReviews();
