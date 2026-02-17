import Product from "../models/Product.js";

// @desc    Get all admin custom products
// @route   GET /api/admin/custom-products
// @access  Admin
export const getAdminCustomProducts = async (req, res) => {
    try {
        console.log("🎨 GET /admin/custom-products called");
        console.log("User:", req.user);

        const products = await Product.find({
            sellerType: "Admin",
            listingType: "custom",
        }).sort({ createdAt: -1 });

        console.log(`✅ Found ${products.length} custom products`);

        res.json({ success: true, products, count: products.length });
    } catch (error) {
        console.error("❌ Error fetching admin custom products:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch custom products",
            message: error.message,
        });
    }
};

// @desc    Get single admin custom product
// @route   GET /api/admin/custom-products/:id
// @access  Admin
export const getAdminCustomProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found",
            });
        }

        if (product.sellerType !== "Admin" || product.listingType !== "custom") {
            return res.status(403).json({
                success: false,
                error: "Not an admin custom product",
            });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error("Error fetching custom product:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch product",
            message: error.message,
        });
    }
};

// @desc    Create admin custom product
// @route   POST /api/admin/custom-products
// @access  Admin
export const createAdminCustomProduct = async (req, res) => {
    try {
        console.log("📦 Creating admin custom product...");
        console.log("Body:", req.body);
        console.log("Files:", req.files);

        const { name, title, description, price, size } = req.body;

        // Validation
        if (!name && !title) {
            return res.status(400).json({
                success: false,
                error: "Product name/title is required",
            });
        }



        if (!price || Number(price) <= 0) {
            return res.status(400).json({
                success: false,
                error: "Valid price is required",
            });
        }

        if (!size) {
            return res.status(400).json({
                success: false,
                error: "Size is required",
            });
        }

        if (!req.files || !req.files.frontImage || !req.files.backImage) {
            return res.status(400).json({
                success: false,
                error: "Both front and back images are required",
            });
        }

        // Process images - files are already saved by multer
        // Process images - use the path provided by multer (Cloudinary URL)
        const images = [
            req.files.frontImage[0].path,
            req.files.backImage[0].path
        ];
        console.log("✅ Images processed:", images);

        // Create product
        const product = await Product.create({
            name: name || title,
            description,
            size,
            images,
            category: "custom",
            sellerType: "Admin",
            sellerName: "Admin Store",
            listingType: "custom",
            price: Number(price),
            stock: 999,
            isActive: true,
            status: "approved", // Auto-approve admin custom products
        });

        console.log("✅ Custom product created:", product._id);

        res.status(201).json({
            success: true,
            message: "Custom product created successfully",
            product,
        });
    } catch (error) {
        console.error("❌ Error creating custom product:", error);
        console.error("❌ Error details:", error.message);
        console.error("❌ Error stack:", error.stack);
        res.status(500).json({
            success: false,
            error: "Failed to create custom product",
            message: error.message,
            details: error.errors ? Object.values(error.errors).map(e => e.message) : undefined,
        });
    }
};

// @desc    Update admin custom product
// @route   PUT /api/admin/custom-products/:id
// @access  Admin
export const updateAdminCustomProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found",
            });
        }

        if (product.sellerType !== "Admin" || product.listingType !== "custom") {
            return res.status(403).json({
                success: false,
                error: "Not an admin custom product",
            });
        }

        const { name, title, description, price, size } = req.body;

        // Update fields
        if (name || title) product.name = name || title;
        if (description) product.description = description;
        if (price) product.price = Number(price);
        if (size) product.size = size;

        // Handle new images if uploaded
        if (req.files) {
            let imagesUpdated = false;
            const currentImages = [...product.images];

            if (req.files.frontImage) {
                currentImages[0] = req.files.frontImage[0].path;
                imagesUpdated = true;
            }
            if (req.files.backImage) {
                currentImages[1] = req.files.backImage[0].path;
                imagesUpdated = true;
            }

            if (imagesUpdated) {
                product.images = currentImages;
            }
        }

        await product.save();

        res.json({
            success: true,
            message: "Custom product updated successfully",
            product,
        });
    } catch (error) {
        console.error("Error updating custom product:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update custom product",
            message: error.message,
        });
    }
};

// @desc    Delete admin custom product
// @route   DELETE /api/admin/custom-products/:id
// @access  Admin
export const deleteAdminCustomProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found",
            });
        }

        if (product.sellerType !== "Admin" || product.listingType !== "custom") {
            return res.status(403).json({
                success: false,
                error: "Not an admin custom product",
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: "Custom product deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting custom product:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete custom product",
            message: error.message,
        });
    }
};

// @desc    Get custom products for homepage (first 8)
// @route   GET /api/custom-products/featured
// @access  Public
export const getFeaturedCustomProducts = async (req, res) => {
    try {
        const products = await Product.find({
            sellerType: "Admin",
            listingType: "custom",
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .limit(8);

        res.json({ success: true, products, count: products.length });
    } catch (error) {
        console.error("Error fetching featured custom products:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch featured products",
            message: error.message,
        });
    }
};

// @desc    Get all custom products for gallery page
// @route   GET /api/custom-products
// @access  Public
export const getAllCustomProducts = async (req, res) => {
    try {
        const products = await Product.find({
            sellerType: "Admin",
            listingType: "custom",
            isActive: true,
        }).sort({ createdAt: -1 });

        res.json({ success: true, products, count: products.length });
    } catch (error) {
        console.error("Error fetching custom products:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch custom products",
            message: error.message,
        });
    }
};
