import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testUpload = async () => {
    try {
        const formData = new FormData();
        const imagePath = path.join(__dirname, 'test_image.png');
        
        // Ensure test image exists
        if (!fs.existsSync(imagePath)) {
            console.error("Test image not found at " + imagePath);
            return;
        }

        formData.append('images', fs.createReadStream(imagePath));

        console.log('📤 Sending POST to http://localhost:5000/api/products/test-upload');
        
        const response = await axios.post('http://localhost:5000/api/products/test-upload', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.response) {
            console.error('Data:', err.response.data);
            console.error('Status:', err.response.status);
        }
    }
};

testUpload();
