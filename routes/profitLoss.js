const express = require('express');
const Invoice = require('../models/Invoice');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all invoices and inventory items
    const invoices = await Invoice.find({ userId });
    const inventoryItems = await InventoryItem.find({ userId });

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Calculate total cost from sold items
    let totalCost = 0;
    for (const invoice of invoices) {
      for (const item of invoice.items) {
        const inventoryItem = await InventoryItem.findById(item.itemId);
        if (inventoryItem) {
          totalCost += inventoryItem.purchasePrice * item.quantity;
        }
      }
    }

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    res.json({
      totalRevenue,
      totalProfit: Math.max(0, totalProfit),
      totalCost,
      profitMargin: parseFloat(profitMargin)
    });
  } catch (error) {
    console.error('Profit & Loss error:', error);
    res.status(500).json({ message: 'Error fetching profit & loss data' });
  }
});

module.exports = router;

