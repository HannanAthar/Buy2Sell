import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = 'e:/FYP/Buy2Sell/frontend/public';
const imagesToConvert = [
    '19.jpg',
    '34.jpg',
    '38.png',
    '42.png',
    '26.png',
    '41.png',
    '28.png'
];

async function convert() {
    for (const file of imagesToConvert) {
        const inputPath = path.join(publicDir, file);
        if (!fs.existsSync(inputPath)) {
            console.log(`Skipping ${file} (not found)`);
            continue;
        }

        const ext = path.extname(file);
        const name = path.basename(file, ext);
        const outputPath = path.join(publicDir, `${name}.webp`);

        try {
            console.log(`Converting ${file} to WebP...`);
            await sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath);
            console.log(`Created ${name}.webp`);
            
            // Optional: consistency check
            const statsIn = fs.statSync(inputPath);
            const statsOut = fs.statSync(outputPath);
            console.log(`Size: ${(statsIn.size / 1024 / 1024).toFixed(2)}MB -> ${(statsOut.size / 1024 / 1024).toFixed(2)}MB`);
            
        } catch (err) {
            console.error(`Error converting ${file}:`, err);
        }
    }
}

convert();
