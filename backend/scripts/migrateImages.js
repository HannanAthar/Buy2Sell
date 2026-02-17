import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const migrateImages = async () => {
  try {
    const mongoUri = process.env.MONGO_CONN || process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_CONN not found in .env");

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  
    // Find products with images that are NOT cloudinary URLs (assuming local paths start with /uploads)
    // Adjust logic if your local paths are different
    const products = await Product.find({
      $or: [
        { images: { $elemMatch: { $regex: /^\/uploads\// } } }
      ]
    });
    
    console.log(`Found ${products.length} products to check/migrate.`);
  
    for (constproduct of products) {
      let changed = false;
      const newImages = [];

      for (const imgPath of product.images) {
        // Check if local path
        if (imgPath.startsWith('/uploads/')) {
            try {
                // Construct absolute path
                // imgPath is like "/uploads/foo.jpg" -> we need "f:/.../backend/uploads/foo.jpg"
                const localPath = path.join(__dirname, '..', imgPath);
                
                if (!fs.existsSync(localPath)) {
                    console.warn(`⚠️ File not found locally: ${localPath}, skipping.`);
                    newImages.push(imgPath); // Keep original if file missing
                    continue;
                }

                console.log(`Uploading ${localPath}...`);
                const result = await cloudinary.uploader.upload(localPath, {
                    folder: 'buy2sell/products'
                });

                console.log(`✅ Uploaded: ${result.secure_url}`);
                newImages.push(result.secure_url);
                changed = true;
            } catch (err) {
                console.error(`❌ Failed to upload ${imgPath}:`, err.message);
                newImages.push(imgPath); // Keep original on failure
            }
        } else {
            // Already a URL (or cloud link), keep it
            newImages.push(imgPath);
        }
      }

      if (changed) {
        product.images = newImages;
        await product.save();
        console.log(`💾 Updated product: ${product.name}`);
      }
    }
  
    console.log('Migration complete!');
  } catch (err) {
      console.error("Migration error:", err);
  } finally {
      mongoose.disconnect();
  }
};

migrateImages();
