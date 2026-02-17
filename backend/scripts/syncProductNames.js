
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Designer from '../models/Designer.js';
import Reseller from '../models/Reseller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const syncNames = async () => {
  try {
    if (!process.env.MONGO_CONN && !process.env.MONGO_URI) {
      throw new Error("MONGO_CONN or MONGO_URI not found in environment");
    }
    const mongoUri = process.env.MONGO_CONN || process.env.MONGO_URI;
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Starting Name Synchronization...');

    // 1. Sync Designers
    const designers = await Designer.find({});
    console.log(`found ${designers.length} designers`);
    
    for (const d of designers) {
      // Logic from createProduct: seller.brandName || seller.wardrobeName || seller.fullName
      // But user typically updates "fullName" in settings. 
      // If the product was created with brandName, should we overwrite it with fullName?
      // The user request says "One Single Source of Truth". "Hannan E" -> "Hannan Athar".
      // This implies we should prioritize the name effectively used for display.
      // Let's stick to fullName for consistency if that's what's being displayed/updated in the profile.
      // However, if a designer has a 'brandName', that usually overrides fullName in display.
      // Let's check what the updateDesignerProfile does. It updates `sellerName` to `fullName`.
      // So to be consistent with my previous fix, I should use `fullName`.
      // BUT if the designer has a brandName, maybe they *want* to be known by that.
      // Let's assume fullName is the primary display name for now as per the "Hannan Athar" example.
      
      const nameToUse = d.fullName; 

      if (!nameToUse) continue;

      const res = await Product.updateMany(
        { sellerId: d._id, sellerType: 'Designer' },
        { $set: { sellerName: nameToUse } }
      );
      
      if (res.modifiedCount > 0) {
        console.log(`   Detailed: Updated ${res.modifiedCount} products for Designer ${d.fullName} (${d._id})`);
      }
    }

    // 2. Sync Resellers
    const resellers = await Reseller.find({});
    console.log(`found ${resellers.length} resellers`);

    for (const r of resellers) {
      const nameToUse = r.fullName;
      if (!nameToUse) continue;

      const res = await Product.updateMany(
        { sellerId: r._id, sellerType: { $in: ['Reseller', 'reseller'] } }, // Handle case sensitivity just in case
        { $set: { sellerName: nameToUse } }
      );

      if (res.modifiedCount > 0) {
         console.log(`   Detailed: Updated ${res.modifiedCount} products for Reseller ${r.fullName} (${r._id})`);
      }
    }

    console.log('✅ Synchronization Complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

syncNames();
