// controllers/cartController.js
import Cart from "../models/Cart.js";

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Login required" });
        }

        let cart = await Cart.findOne({ userId }).populate("items.productId");

        // If cart doesn't exist, create an empty one
        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        res.json({ success: true, cart });
    } catch (err) {
        console.error("getCart error:", err);
        res.status(500).json({ error: "Failed to fetch cart" });
    }
};

/**
 * Add item to cart
 * POST /api/cart
 */
export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Login required" });
        }

        const {
            productId,
            id,
            name,
            image,
            imageUrls,
            price,
            sellingPrice,
            quantity,
            sellerType,
            sellerId,
            size,
            color,
            description,
            isCustom,
            designData,
            productMeta,
            source,
            cartId,
            customPreview,
        } = req.body;

        const isCustomItem = !!isCustom || source === "custom-shirt";

        const itemPrice = price ?? sellingPrice ?? 0;
        const regularItemId = productId || id;

        // Validation:
        //  - name + price always required
        //  - for NON custom items, we also require a product id
        if (!name || !itemPrice || (!isCustomItem && !regularItemId)) {
            return res.status(400).json({
                error:
                    "Missing required fields. Need name + price (and productId/id for non-custom items).",
            });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        if (isCustomItem) {
            // ✅ CUSTOM ITEM – DO NOT SET productId (avoids ObjectId cast error)
            cart.items.push({
                // no productId here on purpose
                name,
                image: image || (imageUrls && imageUrls[0]),
                imageUrls,
                price: itemPrice,
                sellingPrice: itemPrice,
                quantity: quantity || 1,
                sellerType: sellerType || "custom",
                sellerId,
                size,
                color,
                description,
                isCustom: true,
                designData,
                productMeta,
                source: source || "custom-shirt",
                cartId: cartId || Date.now(),
                customPreview,
            });
        } else {
            // ✅ REGULAR PRODUCT – uses productId and can merge quantities
            const itemId = regularItemId;

            const existingItemIndex = cart.items.findIndex(
                (item) =>
                    item.productId &&
                    item.productId.toString() === itemId.toString() &&
                    !item.isCustom
            );

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity || 1;
            } else {
                cart.items.push({
                    productId: itemId,
                    name,
                    image,
                    imageUrls,
                    price: itemPrice,
                    sellingPrice: itemPrice,
                    quantity: quantity || 1,
                    sellerType,
                    sellerId,
                    size,
                    color,
                    description,
                });
            }
        }

        await cart.save();

        // Only populate product references for non-custom items
        if (!isCustomItem) {
            try {
                await cart.populate("items.productId");
            } catch (populateErr) {
                console.warn("Could not populate product IDs:", populateErr.message);
            }
        }

        return res.json({ success: true, cart });
    } catch (err) {
        console.error("addToCart error:", err);
        return res.status(500).json({
            error: "Failed to add to cart",
            details: err.message,
        });
    }
};


/**
 * Update cart item quantity
 * PUT /api/cart/:itemId
 */
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Login required" });
        }

        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: "Invalid quantity" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(404).json({ error: "Item not found in cart" });
        }

        item.quantity = quantity;
        await cart.save();
        await cart.populate("items.productId");

        res.json({ success: true, cart });
    } catch (err) {
        console.error("updateCartItem error:", err);
        res.status(500).json({ error: "Failed to update cart item" });
    }
};

/**
 * Remove item from cart
 * DELETE /api/cart/:itemId
 */
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Login required" });
        }

        const { itemId } = req.params;

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
        await cart.save();
        await cart.populate("items.productId");

        res.json({ success: true, cart });
    } catch (err) {
        console.error("removeFromCart error:", err);
        res.status(500).json({ error: "Failed to remove from cart" });
    }
};

/**
 * Clear entire cart
 * DELETE /api/cart
 */
export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Login required" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        cart.items = [];
        await cart.save();

        res.json({ success: true, cart });
    } catch (err) {
        console.error("clearCart error:", err);
        res.status(500).json({ error: "Failed to clear cart" });
    }
};
