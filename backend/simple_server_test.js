import express from 'express';
import { uploadProductFiles } from './middlewares/uploadMiddleware.js';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 5001; // Different port

app.post('/test', uploadProductFiles, (req, res) => {
    console.log('✅ Route hit!');
    console.log('Files:', JSON.stringify(req.files[0].path, null, 2));
    res.json({ path: req.files[0].path });
});

const server = app.listen(PORT, async () => {
    console.log(`Server running on ${PORT}`);
    
    // Self-test
    try {
        const formData = new FormData();
        const imagePath = path.join(__dirname, 'test_image.png');
        formData.append('images', fs.createReadStream(imagePath));
        
        console.log('📤 Uploading...');
        const response = await axios.post(`http://localhost:${PORT}/test`, formData, {
            headers: formData.getHeaders()
        });
        
        console.log('✅ Success! Path:', response.data.path);
        
    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.response) console.error(err.response.data);
    } finally {
        server.close();
        process.exit(0);
    }
});
