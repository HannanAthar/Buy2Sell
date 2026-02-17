import Wishlist from '../models/Wishlist.js';

export const getWishlist = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: 'Please login to view your wishlist' 
            });
        }

        const userId = req.user.id;
        let wishlist = await Wishlist.findOne({ userId }).populate('products');

        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, products: [] });
        }

        res.json({ success: true, wishlist: wishlist.products });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

export const addToWishlist = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: 'Please login to add items to wishlist' 
            });
        }

        const userId = req.user.id;
        const { productId } = req.body;

        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, products: [] });
        }

        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }

        await wishlist.populate('products');
        res.json({ success: true, wishlist: wishlist.products });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
};

export const removeFromWishlist = async (req, res) => {
    try {
        // Check authentication
        if (!req.user || !req.user.id) {
            return res.status(401).json({ 
                success: false,
                error: 'Please login to remove items from wishlist' 
            });
        }

        const userId = req.user.id;
        const { productId } = req.params;

        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
            await wishlist.save();
            await wishlist.populate('products');
        }

        res.json({ success: true, wishlist: wishlist ? wishlist.products : [] });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
};
