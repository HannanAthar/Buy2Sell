// utils/stockUtils.js
import Product from '../models/Product.js';

/**
 * Decreases stock for order items
 * @param {Array} items - Order items from order.items
 * @param {String} orderId - Order ID for idempotency
 * @returns {Promise<Object>} Result with success status and errors
 */
export async function decrementStockForOrder(items, orderId) {
  const results = {
    success: true,
    decremented: [],
    skipped: [],
    errors: []
  };

  for (const item of items) {
    // Skip custom items (no productId or isCustom flag)
    if (!item.productId || item.isCustom || item.sellerType === 'custom') {
      results.skipped.push({
        name: item.name,
        reason: 'Custom item - no inventory tracking'
      });
      continue;
    }

    try {
      const product = await Product.findById(item.productId);

      if (!product) {
        results.errors.push({
          productId: item.productId,
          name: item.name,
          error: 'Product not found'
      });
        results.success = false;
        continue;
      }

      // Idempotency check: Has this order already been processed?
      const alreadyProcessed = product.stockAdjustments?.some(
        adj => adj.orderId && adj.orderId.toString() === orderId.toString()
      );

      if (alreadyProcessed) {
        results.skipped.push({
          productId: item.productId,
          name: item.name,
          reason: 'Already processed'
        });
        continue;
      }

      // Validate sufficient stock
      if (product.stock < item.quantity) {
        results.errors.push({
          productId: item.productId,
          name: item.name,
          error: `Insufficient stock. Available: ${product.stock}, Required: ${item.quantity}`
        });
        results.success = false;
        continue;
      }

      // Decrement stock and record adjustment
      product.stock -= item.quantity;
      
      if (!product.stockAdjustments) {
        product.stockAdjustments = [];
      }

      product.stockAdjustments.push({
        orderId: orderId,
        quantity: item.quantity,
        type: 'decrement',
        reason: item.isRent ? 'Rental order shipped' : 'Order shipped/completed',
        timestamp: new Date()
      });

      // AUTO-HIDE products when stock reaches zero
      // IMPORTANT: Do NOT hide rental products - they should show "ALREADY RENTED" overlay instead
      if (product.stock === 0 && product.listingType !== 'rent') {
        product.isActive = false;
        console.log(`🔒 Product auto-hidden (zero stock): ${product.name}`);
      }

      await product.save();

      results.decremented.push({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        newStock: product.stock,
        autoHidden: product.stock === 0 && product.listingType !== 'rent'
      });

      console.log(`📦 Stock decremented: ${item.name} (${item.quantity} units) - New stock: ${product.stock}${product.stock === 0 && product.listingType !== 'rent' ? ' [AUTO-HIDDEN]' : ''}`);

    } catch (error) {
      results.errors.push({
        productId: item.productId,
        name: item.name,
        error: error.message
      });
      results.success = false;
    }
  }

  return results;
}

/**
 * Restores stock for cancelled orders
 * @param {String} orderId - Order ID to restore stock for
 * @param {Array} items - Order items to restore stock for
 * @returns {Promise<Object>} Result with restored items count
 */
export async function restoreStockForOrder(orderId, items) {
  const results = {
    success: true,
    restored: [],
    skipped: [],
    errors: []
  };

  for (const item of items) {
    // Skip custom items
    if (!item.productId || item.isCustom || item.sellerType === 'custom') {
      results.skipped.push({
        name: item.name,
        reason: 'Custom item - no inventory tracking'
      });
      continue;
    }

    try {
      const product = await Product.findById(item.productId);

      if (!product) {
        results.errors.push({
          productId: item.productId,
          name: item.name,
          error: 'Product not found'
        });
        continue;
      }

      // Find the original decrement adjustment for this order
      const originalAdjustment = product.stockAdjustments?.find(
        adj => adj.orderId && adj.orderId.toString() === orderId.toString() && adj.type === 'decrement'
      );

      if (!originalAdjustment) {
        results.skipped.push({
          productId: item.productId,
          name: item.name,
          reason: 'No previous stock adjustment found for this order'
        });
        continue;
      }

      // Check if already restored
      const alreadyRestored = product.stockAdjustments?.some(
        adj => adj.orderId && adj.orderId.toString() === orderId.toString() && adj.type === 'restore'
      );

      if (alreadyRestored) {
        results.skipped.push({
          productId: item.productId,
          name: item.name,
          reason: 'Stock already restored'
        });
        continue;
      }

      // Check if product was hidden (only non-rental products get hidden)
      const wasHidden = product.stock === 0 && !product.isActive && product.listingType !== 'rent';

      // Restore stock
      product.stock += originalAdjustment.quantity;

      product.stockAdjustments.push({
        orderId: orderId,
        quantity: originalAdjustment.quantity,
        type: 'restore',
        reason: 'Order cancelled',
        timestamp: new Date()
      });

      // AUTO-REACTIVATE if product was hidden due to zero stock (non-rental only)
      if (wasHidden && product.stock > 0) {
        product.isActive = true;
        console.log(`🔓 Product auto-reactivated (stock restored): ${product.name}`);
      }

      await product.save();

      results.restored.push({
        productId: item.productId,
        name: item.name,
        quantity: originalAdjustment.quantity,
        newStock: product.stock,
        autoReactivated: wasHidden && product.stock > 0
      });

      console.log(`🔄 Stock restored: ${item.name} (+${originalAdjustment.quantity} units) - New stock: ${product.stock}${wasHidden && product.stock > 0 ? ' [AUTO-REACTIVATED]' : ''}`);

    } catch (error) {
      results.errors.push({
        productId: item.productId,
        name: item.name,
        error: error.message
      });
      results.success = false;
    }
  }

  return results;
}

/**
 * Marks product as rented
 * @param {String} productId - Product to mark as rented
 * @param {Object} rentalInfo - Rental details (orderId, renterId, startDate, endDate)
 * @returns {Promise<Object>} Updated product
 */
export async function markProductAsRented(productId, rentalInfo) {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.listingType !== 'rent') {
      throw new Error('Product is not available for rent');
    }

    if (product.rentalStatus === 'rented') {
      throw new Error('Product is already rented');
    }

    // Update rental status
    product.rentalStatus = 'rented';
    product.currentRental = {
      orderId: rentalInfo.orderId,
      renterId: rentalInfo.renterId,
      startDate: rentalInfo.startDate || new Date(),
      endDate: rentalInfo.endDate,
      status: 'active'
    };

    // Add to rental history
    if (!product.rentalHistory) {
      product.rentalHistory = [];
    }

    product.rentalHistory.push({
      orderId: rentalInfo.orderId,
      renterId: rentalInfo.renterId,
      startDate: rentalInfo.startDate || new Date(),
      endDate: rentalInfo.endDate,
      status: 'ongoing'
    });

    await product.save();

    console.log(`🏷️ Product marked as rented: ${product.name} (Order: ${rentalInfo.orderId})`);

    return product;
  } catch (error) {
    console.error('Error marking product as rented:', error);
    throw error;
  }
}

/**
 * Marks product as available (returns from rental)
 * @param {String} productId - Product to mark as available
 * @param {Number} stockQty - Quantity to restore (default: 1)
 * @returns {Promise<Object>} Updated product
 */
export async function markProductAsAvailable(productId, stockQty = 1) {
  try {
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Update current rental to completed
    if (product.currentRental) {
      product.currentRental.status = 'completed';
    }

    // Update rental history
    if (product.rentalHistory && product.rentalHistory.length > 0) {
      const lastRental = product.rentalHistory[product.rentalHistory.length - 1];
      if (lastRental.status === 'ongoing') {
        lastRental.status = 'completed';
        lastRental.returnedDate = new Date();
      }
    }
    // Clear current rental info
    if (product.currentRental) {
      product.currentRental = undefined;
    }
    
    // Explicitly set rentalStatus to available
    product.rentalStatus = 'available';
    product.isActive = true; // Ensure it's visible
    
    // Update stock
    product.stock = stockQty;

    await product.save();

    console.log(`✅ Product ${product._id} marked as available for rent (Stock: ${stockQty})`);
    return product;
  } catch (error) {
    console.error("Error marking product as available:", error);
    throw error;
  }
};
