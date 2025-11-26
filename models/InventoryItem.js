const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    min: 0
  },
  purity: {
    type: String,
    trim: true
  },
  purchasePrice: {
    type: Number,
    min: 0
  },
  sellingPrice: {
    type: Number,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);

