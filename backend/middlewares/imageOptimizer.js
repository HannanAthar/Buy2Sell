import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * ⚡ PERFORMANCE: Image Optimization Middleware
 * Automatically compresses and resizes uploaded images
 * Goal: Reduce 1MB+ images to <150KB
 */
export const optimizeImages = async (req, res, next) => {
  // Skip if no files uploaded
  if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0))) {
    return next();
  }

  try {
    const files = [];
    if (req.file) files.push(req.file);
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        Object.values(req.files).forEach(arr => files.push(...arr));
      }
    }

    // Process all images in parallel
    await Promise.all(files.map(async (file) => {
      // Skip non-image files
      if (!file.mimetype.startsWith('image/')) return;

      const filePath = file.path;
      // Temp path for optimized version
      const optimizedPath = filePath + '.optimized';

      try {
        const image = sharp(filePath);
        const metadata = await image.metadata();

        // 1. Resize if too large (Max width 1280px - ample for standard web)
        if (metadata.width > 1280) {
          image.resize({ width: 1280, withoutEnlargement: true });
        }

        // 2. Compassion settings based on format
        // We keep original format to avoid renaming files/DB entries
        if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
          image.jpeg({ quality: 80, mozjpeg: true }); // High compression
        } else if (metadata.format === 'png') {
          image.png({ quality: 80, compressionLevel: 8, palette: true }); // Palette reduces size significantly
        } else if (metadata.format === 'webp') {
          image.webp({ quality: 80 });
        } else {
          // Fallback for others (GIF, etc) - just optimize generic
          // GIF optimization is limited in sharp, but ok.
        }

        // Write to temp file
        await image.toFile(optimizedPath);

        // Replace original file with optimized one
        // We use fs.copyFile instead of rename to ensure atomic replacement on some systems, 
        // but renameSync is generally fine.
        // On windows unlink + rename is safer.
        fs.unlinkSync(filePath);
        fs.renameSync(optimizedPath, filePath);
        
        // Update file size in request object if needed (though usually not used after this)
        const newStats = fs.statSync(filePath);
        file.size = newStats.size;

        // Log savings
        // console.log(`⚡ Optimized ${file.originalname}: ${(file.size / 1024).toFixed(1)}KB -> ${(newStats.size / 1024).toFixed(1)}KB`);

      } catch (err) {
        console.error(`Failed to optimize ${file.originalname}:`, err);
        // If optimization fails, we keep original file.
        if (fs.existsSync(optimizedPath)) fs.unlinkSync(optimizedPath);
      }
    }));

    next();
  } catch (err) {
    console.error('Image optimization middleware error:', err);
    next(); // Continue even if optimization fails
  }
};
