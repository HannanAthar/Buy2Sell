
import mongoose from 'mongoose';
import User from '../models/User.js';
import Designer from '../models/Designer.js';
import Reseller from '../models/Reseller.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_CONN);
        const name = 'Nabiha Batool';
        console.log('Searching for:', name);

        const regex = new RegExp(`^${name}$`, 'i');

        const u = await User.findOne({ fullName: regex });
        if (u) console.log('Found User:', u.fullName, u.email, u._id);

        const d = await Designer.findOne({ fullName: regex });
        if (d) console.log('Found Designer:', d.fullName, d.email, d._id);

        const r = await Reseller.findOne({ fullName: regex });
        if (r) console.log('Found Reseller:', r.fullName, r.email, r._id);

        // Also check email just in case
        const email = 'nabiha123@gmail.com';
        const u2 = await User.findOne({ email });
        if (u2) console.log('Found User only by email:', u2.email);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
check();
