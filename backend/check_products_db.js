import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const ProductSchema = new mongoose.Schema({
    name: String,
    status: String,
    isActive: Boolean,
    sellerName: String
}, { strict: false });

const Product = mongoose.model('Product', ProductSchema);

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_CONN);
        console.log('✅ Connected to MongoDB');

        const counts = await Product.aggregate([
            {
                $group: {
                    _id: { status: '$status', isActive: '$isActive' },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('Product Status Counts:');
        console.log(JSON.stringify(counts, null, 2));

        const samples = await Product.find({}).limit(5).select('name status isActive sellerName');
        console.log('\nSample Products:');
        console.log(JSON.stringify(samples, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

checkProducts();
