import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function wipeDatabase() {
  const uri = process.env.MONGO_CONN;
  if (!uri) {
    console.error("MONGO_CONN not found in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(uri);
    console.log("Connected to Buy2Sell database.");

    // Drop collections in Buy2Sell
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('designers')) {
      await db.collection('designers').drop();
      console.log("✅ Successfully dropped 'designers' collection from Buy2Sell.");
    } else {
      console.log("ℹ️ 'designers' collection does not exist in Buy2Sell.");
    }

    if (collectionNames.includes('resellers')) {
      await db.collection('resellers').drop();
      console.log("✅ Successfully dropped 'resellers' collection from Buy2Sell.");
    } else {
      console.log("ℹ️ 'resellers' collection does not exist in Buy2Sell.");
    }
    
    // rentals were also mentioned as a legacy concept
    if (collectionNames.includes('rentals')) {
      await db.collection('rentals').drop();
      console.log("✅ Successfully dropped 'rentals' collection from Buy2Sell.");
    }
    if (collectionNames.includes('rentalhistories')) {
        await db.collection('rentalhistories').drop();
        console.log("✅ Successfully dropped 'rentalhistories' collection from Buy2Sell.");
      }

    // Now connect to the 'test' database to drop it completely
    console.log("Switching to 'test' database...");
    const testDb = mongoose.connection.useDb('test').db;
    await testDb.dropDatabase();
    console.log("✅ Successfully dropped the entire 'test' database.");

  } catch (error) {
    console.error("Error during database wipe:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

wipeDatabase();
