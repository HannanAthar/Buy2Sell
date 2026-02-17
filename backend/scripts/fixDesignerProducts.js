import mongoose from 'mongoose';
import Product from '../models/Product.js';
import fs from 'fs';
import path from 'path';

const fixProducts = async () => {
    try {
        console.log('📂 CWD:', process.cwd());

        // Manually read .env
        const envPath = path.resolve(process.cwd(), '.env');
        console.log('📄 Reading .env from:', envPath);

        if (!fs.existsSync(envPath)) {
            throw new Error('.env file not found!');
        }

        const envContent = fs.readFileSync(envPath, 'utf-8');
        const mongoUriLine = envContent.split('\n').find(line => line.startsWith('MONGO_CONN='));

        if (!mongoUriLine) {
            throw new Error('MONGO_CONN not found in .env file');
        }

        let uri = mongoUriLine.split('=')[1].trim().replace(/"/g, '').replace(/'/g, '');

        console.log('🔍 URI Start:', uri.substring(0, 15));

        if (!uri.startsWith('mongodb')) {
            console.log('⚠️ URI missing scheme, assuming mongodb://');
            uri = 'mongodb://' + uri;
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected.');

        console.log('🔍 Finding Designer products...');
        const result = await Product.updateMany(
            { sellerType: 'Designer' },
            { $set: { status: 'approved' } }
        );

        console.log(`✅ Updated ${result.modifiedCount} Designer products to 'approved'.`);
        console.log(`ℹ️ Matched ${result.matchedCount} products.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        console.log('👋 Disconnected.');
        process.exit();
    }
};

fixProducts();
