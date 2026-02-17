import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Review from './models/Review.js';
import User from './models/User.js';
import Designer from './models/Designer.js';
import Reseller from './models/Reseller.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const migrateReviewerIdentity = async () => {
  try {
    console.log('🚀 Starting reviewer identity migration...');
    
    // Connect to MongoDB
    if (!process.env.MONGO_CONN) {
      throw new Error('MONGO_CONN not defined in .env');
    }
    await mongoose.connect(process.env.MONGO_CONN);
    console.log('✅ Connected to MongoDB');

    // Find all reviews that don't have reviewerName or reviewerRole
    const reviewsToMigrate = await Review.find({
      $or: [
        { reviewerName: { $exists: false } },
        { reviewerRole: { $exists: false } }
      ]
    }).populate('user');

    console.log(`📊 Found ${reviewsToMigrate.length} reviews to migrate`);

    let successCount = 0;
    let failCount = 0;
    let deletedUserCount = 0;

    for (const review of reviewsToMigrate) {
      try {
        let userName = 'Anonymous User';
        let userRole = 'buyer';

        if (review.user) {
          // User still exists, get their info
          userName = review.user.fullName || review.user.name || 'Anonymous User';
          userRole = review.user.role || 'buyer';
        } else {
          // User was deleted, try to infer from designer/reseller fields
          console.log(`⚠️  Review ${review._id}: User no longer exists`);
          deletedUserCount++;
          
          if (review.designer) {
            const designer = await Designer.findById(review.designer);
            if (designer) {
              userName = designer.fullName || designer.name || 'Former Designer';
              userRole = 'designer';
            }
          } else if (review.reseller) {
            const reseller = await Reseller.findById(review.reseller);
            if (reseller) {
              userName = reseller.fullName || reseller.name || 'Former Reseller';
              userRole = 'reseller';
            }
          }
        }

        // Update the review
        review.reviewerName = userName;
        review.reviewerRole = userRole;
        await review.save();
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`✅ Migrated ${successCount} reviews...`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate review ${review._id}:`, error.message);
        failCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⚠️  Deleted users encountered: ${deletedUserCount}`);
    console.log('\n✨ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run migration
migrateReviewerIdentity();
