import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Dictionary of folder names for different upload types
const FOLDERS = {
  profile: 'buy2sell/profiles',
  products: 'buy2sell/products',
  custom: 'buy2sell/custom-designs',
  defaults: 'buy2sell/misc'
};

// Generic storage generator
const createStorage = (folderName) => new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Async params function for dynamic control
    return {
      folder: folderName,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    };
  }
});

const productStorage = createStorage(FOLDERS.products);
const profileStorage = createStorage(FOLDERS.profile);

// General upload (defaulting to products for safety)
const uploadProduct = multer({ 
    storage: productStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
const uploadProfile = multer({ storage: profileStorage });

// ---- Exports matching existing routes ----

export const uploadSingle = uploadProfile.single('profileImage');
export const uploadLogo = uploadProfile.single('logo');

export const uploadDesignerFiles = uploadProfile.fields([{ name: 'logo', maxCount: 1 }]);
export const uploadResellerFiles = uploadProfile.fields([{ name: 'logo', maxCount: 1 }]);

export const uploadProductFiles = (req, res, next) => {
    console.log("⚡ Multer Middleware Hit: uploadProductFiles");
    uploadProduct.array('images', 8)(req, res, (err) => {
        if (err) {
            console.error("❌ Multer Error:", err);
            return res.status(400).json({ error: "Image upload failed: " + err.message });
        }
        console.log("✅ Multer Success. Files:", req.files?.length);
        next();
    });
};

export const uploadCustomProductFiles = uploadProduct.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 },
]);

// Helper to keep the interface consistent
export const validateFileContent = (req, res, next) => {
    console.log("🔍 validateFileContent Hit. Files:", req.files?.length);
    next();
};
