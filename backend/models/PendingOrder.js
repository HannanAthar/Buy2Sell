import mongoose from 'mongoose';

const PendingOrderSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    buyerId: String,
    buyerEmail: {
        type: String,
        required: true
    },
    items: [{
        type: mongoose.Schema.Types.Mixed
    }],
    totals: {
        type: mongoose.Schema.Types.Mixed
    },
    shippingAddress: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Auto-delete after 1 hour
    }
});

export default mongoose.model('PendingOrder', PendingOrderSchema);
