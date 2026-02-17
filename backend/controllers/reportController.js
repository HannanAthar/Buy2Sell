import Order from '../models/Order.js';

export const getSalesReport = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    let matchStage = {};
    
    // Date filtering
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    let groupFormat;
    switch (period) {
      case 'daily':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: "%Y-%U", date: "$createdAt" } };
        break;
      case 'monthly':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      case 'yearly':
        groupFormat = { $dateToString: { format: "%Y", date: "$createdAt" } };
        break;
      default: 
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }
    
    // Aggregate completed or paid orders
    const report = await Order.aggregate([
      { $match: matchStage },
      // Consider orders that are not cancelled and have some valid status indicating a sale
      { $match: { status: { $in: ['completed', 'delivered', 'shipped', 'confirmed', 'processing', 'placed', 'PAID_HELD', 'RELEASED'] } } },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: "$totals.grandTotal" }, // Using totals.grandTotal from your schema
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totals.grandTotal" },
          productsSold: { $sum: { $size: "$items" } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate summary statistics
    const summary = {
        totalRevenue: report.reduce((sum, item) => sum + item.totalSales, 0),
        totalOrders: report.reduce((sum, item) => sum + item.orderCount, 0),
        averageOrderValue: 0
    };

    if (summary.totalOrders > 0) {
        summary.averageOrderValue = summary.totalRevenue / summary.totalOrders;
    }
    
    res.json({
      success: true,
      period,
      report,
      summary
    });
    
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Top Products Report
export const getTopProducts = async (req, res) => {
  try {
    const topProducts = await Order.aggregate([
        { $match: { status: { $in: ['completed', 'delivered', 'shipped', 'confirmed', 'processing', 'PAID_HELD', 'RELEASED'] } } },
        { $unwind: "$items" },
        {
        $group: {
            _id: "$items.productId",
            productName: { $first: "$items.name" },
            totalSold: { $sum: "$items.quantity" },
            // lineTotal is in items schema
            totalRevenue: { $sum: "$items.lineTotal" } 
        }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
    ]);
    
    res.json({ success: true, topProducts });
  } catch (err) {
      console.error('Top products error:', err);
      res.status(500).json({ error: err.message });
  }
};
