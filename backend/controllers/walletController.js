import Order from "../models/Order.js";

/**
 * Get Wallet Data for Seller (Designer/Reseller)
 * Aggregates all completed escrow transfers for the user.
 */
export const getSellerWallet = async (req, res) => {
    try {
        const sellerId = req.user.id;
        if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

        // Find orders where this seller has completed transfers
        const orders = await Order.find({
            "escrow.transfers": {
                $elemMatch: {
                    sellerId: sellerId,
                    status: "completed"
                }
            }
        }).sort({ updatedAt: -1 });

        let totalEarnings = 0;
        const transactions = [];

        for (const order of orders) {
            // Find the specific transfer for this seller
            const transfer = order.escrow.transfers.find(
                t => t.sellerId && t.sellerId.toString() === sellerId && t.status === "completed"
            );

            if (transfer) {
                // Determine correct amount dynamically: (90% of items) + shipping share
                const myItems = order.items.filter(
                    (item) => item.sellerId && item.sellerId.toString() === sellerId
                );
                const myItemTotal = myItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
                const totalGrossItems = order.items.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
                const shipping = Number(order.totals?.shipping || 0);
                const myShippingShare = totalGrossItems > 0 ? (myItemTotal / totalGrossItems) * shipping : 0;

                const calculatedAmount = (myItemTotal * 0.9) + myShippingShare;

                // Use the larger of stored or calculated? 
                // Actually, the user wants the "correct" calculation (after deduction).
                const amount = calculatedAmount;
                totalEarnings += amount;

                transactions.push({
                    orderId: order._id,
                    orderNumber: (order._id || "").toString().slice(-6),
                    date: transfer.updatedAt || order.updatedAt,
                    amount: amount,
                    status: "Paid",
                    type: "Payout"
                });
            }
        }

        res.json({
            balance: totalEarnings, // Total lifetime earnings
            transactions
        });

    } catch (error) {
        console.error("Seller wallet error:", error);
        res.status(500).json({ error: "Failed to fetch wallet data" });
    }
};

/**
 * Get Wallet Data for Admin
 * Aggregates total platform revenue (Commission) from released orders.
 */
export const getAdminWallet = async (req, res) => {
    try {
        // Find all orders that have been fully released or have completed transfers
        // We want to see total incoming vs total outgoing
        const orders = await Order.find({
            $or: [
                { "escrow.status": "released" },
                { "escrow.transfers.status": "completed" } // Capture any partial completions too?
            ]
        }).sort({ updatedAt: -1 });

        let totalPlatformRevenue = 0;
        let totalPayoutsToSellers = 0;
        const transactions = [];

        for (const order of orders) {
            const orderTotal = order.totals?.grandTotal || 0;
            const shipping = Number(order.totals?.shipping || 0);

            // Calculate Platform Revenue: 10% of all seller items in the order
            const sellerItems = order.items.filter(i => i.sellerId);
            const sellerItemsGross = sellerItems.reduce((sum, i) => sum + (i.lineTotal || 0), 0);
            const platformCommission = sellerItemsGross * 0.1;

            // Payout to Sellers (90% of items + shipping)
            const payoutSum = (sellerItemsGross * 0.9) + shipping;

            // Track totals
            totalPayoutsToSellers += payoutSum;
            totalPlatformRevenue += platformCommission;

            transactions.push({
                orderId: order._id,
                orderNumber: (order._id || "").toString().slice(-6),
                date: order.updatedAt,
                orderTotal: orderTotal,
                payouts: payoutSum,
                revenue: platformCommission,
                status: "Released"
            });
        }

        res.json({
            totalRevenue: totalPlatformRevenue,
            totalPayouts: totalPayoutsToSellers,
            transactions
        });

    } catch (error) {
        console.error("Admin wallet error:", error);
        res.status(500).json({ error: "Failed to fetch wallet data" });
    }
};
