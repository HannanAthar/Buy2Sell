import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Save custom design preview (data URI to file)
export const saveCustomDesignPreview = async (req, res) => {
    try {
        const { designId, frontImage, backImage, productName } = req.body;

        if (!designId || (!frontImage && !backImage)) {
            return res.status(400).json({ message: 'Design ID and at least one image required' });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'custom-designs');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const imageUrls = [];

        // Helper function to save a single image
        const saveImage = (dataUri, side) => {
            if (!dataUri) return null;

            // Extract base64 data from data URI
            const matches = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) {
                console.warn(`Invalid ${side} image data`);
                return null;
            }

            const imageType = matches[1]; // png, jpeg, etc.
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            // Generate filename with side indicator
            const filename = `${designId}_${side}.${imageType}`;
            const filepath = path.join(uploadsDir, filename);

            // Save file
            fs.writeFileSync(filepath, buffer);

            return `/uploads/custom-designs/${filename}`;
        };

        // Save front image
        if (frontImage) {
            const frontUrl = saveImage(frontImage, 'front');
            if (frontUrl) imageUrls.push(frontUrl);
        }

        // Save back image
        if (backImage) {
            const backUrl = saveImage(backImage, 'back');
            if (backUrl) imageUrls.push(backUrl);
        }

        if (imageUrls.length === 0) {
            return res.status(400).json({ message: 'Failed to save any images' });
        }

        res.json({
            success: true,
            imageUrls,
            imageUrl: imageUrls[0], // For backward compatibility
            message: `Custom design preview saved successfully (${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''})`
        });
    } catch (error) {
        console.error('Save custom design preview error:', error);
        res.status(500).json({ message: 'Failed to save preview', error: error.message });
    }
};

// Get custom design preview
export const getCustomDesignPreview = async (req, res) => {
    try {
        const { designId } = req.params;

        const uploadsDir = path.join(__dirname, '..', 'uploads', 'custom-designs');

        // Try different image formats
        const formats = ['png', 'jpg', 'jpeg', 'webp'];
        let filepath = null;

        for (const format of formats) {
            const testPath = path.join(uploadsDir, `${designId}.${format}`);
            if (fs.existsSync(testPath)) {
                filepath = testPath;
                break;
            }
        }

        if (!filepath) {
            return res.status(404).json({ message: 'Design preview not found' });
        }

        res.sendFile(filepath);
    } catch (error) {
        console.error('Get custom design preview error:', error);
        res.status(500).json({ message: 'Failed to get preview', error: error.message });
    }
};
