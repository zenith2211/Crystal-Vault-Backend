const express = require('express');
const Invoice = require('../models/Invoice');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Total Sales
    const invoices = await Invoice.find({ userId });
    const totalSales = invoices.reduce((sum, inv) => {
      const amount = inv.grandTotal || inv.totalAmount || 0;
      return sum + (amount || 0);
    }, 0);

    // Inventory Items
    const inventoryItems = await InventoryItem.find({ userId });
    const uniqueItems = inventoryItems.length;

    // Total Profit - calculate from sold items
    let totalCost = 0;
    for (const invoice of invoices) {
      for (const item of invoice.items || []) {
        const inventoryItem = await InventoryItem.findById(item.itemId);
        if (inventoryItem && inventoryItem.purchasePrice) {
          totalCost += (inventoryItem.purchasePrice || 0) * (item.quantity || 0);
        }
      }
    }
    const totalProfit = Math.max(0, totalSales - totalCost);

    // Inventory Value
    const inventoryValue = inventoryItems.reduce((sum, item) => {
      const price = item.purchasePrice || 0;
      const qty = item.quantity || 0;
      return sum + (price * qty);
    }, 0);

    res.json({
      totalSales: totalSales || 0,
      inventoryItems: uniqueItems || 0,
      totalProfit: totalProfit || 0,
      inventoryValue: inventoryValue || 0
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

module.exports = router;

