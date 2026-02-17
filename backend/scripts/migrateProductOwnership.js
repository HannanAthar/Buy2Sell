
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Designer from '../models/Designer.js';
import Reseller from '../models/Reseller.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path for safety
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrateProductOwnership = async () => {
    try {
        if (!process.env.MONGO_CONN) {
            throw new Error('MONGO_CONN is undefined. Check .env path.');
        }
        await mongoose.connect(process.env.MONGO_CONN);
        console.log('✅ Connected to MongoDB');

        const products = await Product.find({});
        console.log(`📦 Found ${products.length} products total.`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            let ownerFound = false;
            let currentSellerId = product.sellerId ? product.sellerId.toString() : null;

            // 1. Check if current sellerId is valid
            if (currentSellerId) {
                const designer = await Designer.findById(currentSellerId);
                const reseller = await Reseller.findById(currentSellerId);

                if (designer || reseller) {
                    ownerFound = true;
                    // Ensure sellerType is correct if possible
                    if (designer && product.sellerType !== 'Designer') {
                        console.log(`⚠️ Product ${product._id} has Designer owner but type is ${product.sellerType}. Fixing...`);
                        product.sellerType = 'Designer';
                        await product.save();
                        updatedCount++;
                    } else if (reseller && product.sellerType !== 'Reseller') {
                        console.log(`⚠️ Product ${product._id} has Reseller owner but type is ${product.sellerType}. Fixing...`);
                        product.sellerType = 'Reseller';
                        await product.save();
                        updatedCount++;
                    }
                }
            }

            // 2. If owner not found by ID, try to recover using sellerName
            if (!ownerFound) {
                const nameToSearch = product.sellerName;
                if (!nameToSearch) {
                    console.log(`❌ Product ${product._id} has no sellerId AND no sellerName. Skipping.`);
                    errorCount++;
                    continue;
                }

                console.log(`🔍 Product ${product._id} (${product.name}) - ID ${currentSellerId} invalid. Searching for name: "${nameToSearch}"...`);

                const designerMatches = await Designer.find({
                    $or: [
                        { brandName: nameToSearch },
                        { wardrobeName: nameToSearch },
                        { fullName: nameToSearch }
                    ]
                });

                const resellerMatches = await Reseller.find({
                    $or: [
                        { brandName: nameToSearch },
                        { wardrobeName: nameToSearch },
                        { fullName: nameToSearch }
                    ]
                });

                const allMatches = [...designerMatches, ...resellerMatches];

                if (allMatches.length === 1) {
                    const match = allMatches[0];
                    const type = designerMatches.length > 0 ? 'Designer' : 'Reseller';

                    console.log(`✅ FOUND MATCH: Linking to ${type} "${match.fullName || match.brandName}" (ID: ${match._id})`);

                    product.sellerId = match._id;
                    product.sellerType = type;
                    await product.save();
                    updatedCount++;
                } else if (allMatches.length > 1) {
                    console.log(`⚠️ Multiple matches found for "${nameToSearch}". Cannot auto-link.`);
                    allMatches.forEach(m => console.log(`   - ${m._id} (${m.email})`));
                    errorCount++;
                } else {
                    console.log(`❌ No user found with name "${nameToSearch}".`);
                    errorCount++;
                }
            } else {
                skippedCount++;
            }
        }

        console.log(`\n🎉 Migration Complete.`);
        console.log(`   - Updated/Fixed: ${updatedCount}`);
        console.log(`   - Skipped (Already Valid): ${skippedCount}`);
        console.log(`   - Errors/Unresolved: ${errorCount}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

migrateProductOwnership();
