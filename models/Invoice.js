const mongoose = require('mongoose');

const BillItemSchema = new mongoose.Schema({
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    quantity: { type: Number, required: true },
    name: String,
    weight: Number,
    purchasePrice: Number,
    sellingPrice: Number,
    totalAmount: Number,
    grossWeight: { type: Number, default: 0 },
    labourPerGram: { type: Number, default: 0 },
    diamondPerCarat: { type: Number, default: 0 },
    fineGold: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 }
});

const BillSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true },
    date: { type: Date, default: Date.now },
    customerName: String,
    items: [BillItemSchema],
    subtotal: Number,
    taxRate: Number,
    taxAmount: Number,
    discountRate: Number,
    discountAmount: Number,
    grandTotal: Number,
    totalAmount: Number // For backward compatibility
});

// Compound index to ensure unique invoice numbers per user
BillSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

BillSchema.set('toJSON', {
    virtuals: true,
    versionKey: false
});

module.exports = mongoose.model('Bill', BillSchema);
