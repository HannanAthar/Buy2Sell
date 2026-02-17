import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'buy2sell/test_upload',
  }
});

const upload = multer({ storage: storage });

console.log('Storage engine:', upload.storage.constructor.name);
if (upload.storage instanceof CloudinaryStorage) {
    console.log('✅ Multer is using CloudinaryStorage');
} else {
    console.log('❌ Multer is NOT using CloudinaryStorage');
}
