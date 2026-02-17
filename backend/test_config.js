import cloudinary from './config/cloudinary.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runTest = async () => {
  console.log('🧪 Testing Cloudinary Config...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '******' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'MISSING');

  try {
    const imagePath = path.join(__dirname, 'test_image.png');
    console.log(`📤 Uploading ${imagePath}...`);

    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'buy2sell/tests'
    });

    console.log('✅ Upload Success!');
    console.log('URL:', result.secure_url);
    console.log('Check your Cloudinary Dashboard now.');

  } catch (err) {
    console.error('❌ Upload Failed:', err);
  }
};

runTest();
