const express = require('express');
const Invoice = require('../models/Invoice');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');
const router = express.Router();

// Get invoice number sequence
const getNextInvoiceNumber = async (userId) => {
  const count = await Invoice.countDocuments({ userId });
  return `INV-${String(count + 1).padStart(4, '0')}`;
};

// Get all invoices for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).populate('items.itemId', 'name category weight purity');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

// Create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Invoice must have at least one item' });
    }

    const invoiceItems = [];
    let subtotal = 0;
    let totalTaxAmount = 0;

    // Process each item
    for (const item of items) {
      const inventoryItem = await InventoryItem.findOne({ 
        _id: item.itemId, 
        userId: req.user._id 
      });

      if (!inventoryItem) {
        return res.status(404).json({ message: `Item ${item.itemId} not found` });
      }

      if ((inventoryItem.quantity || 0) < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient quantity for ${inventoryItem.name || 'item'}. Available: ${inventoryItem.quantity || 0}` 
        });
      }

      const sellingPrice = inventoryItem.sellingPrice || 0;
      const itemSubtotal = item.quantity * sellingPrice;
      subtotal += itemSubtotal;

      // Calculate tax for this item
      const itemTaxRate = item.taxRate || 0;
      const itemTaxAmount = (itemSubtotal * itemTaxRate) / 100;
      totalTaxAmount += itemTaxAmount;

      invoiceItems.push({
        inventoryItemId: inventoryItem._id,
        itemId: inventoryItem._id, // Keep for backward compatibility
        name: inventoryItem.name,
        quantity: item.quantity,
        price: sellingPrice,
        sellingPrice: sellingPrice,
        total: itemSubtotal,
        totalAmount: itemSubtotal,
        weight: inventoryItem.weight,
        grossWeight: item.grossWeight || 0,
        labourPerGram: item.labourPerGram || 0,
        diamondPerCarat: item.diamondPerCarat || 0,
        fineGold: item.fineGold || 0,
        taxRate: itemTaxRate
      });

      // Update inventory quantity
      inventoryItem.quantity = (inventoryItem.quantity || 0) - item.quantity;
      await inventoryItem.save();
    }

    const grandTotal = subtotal + totalTaxAmount;

    const invoiceNumber = await getNextInvoiceNumber(req.user._id);

    const invoice = new Invoice({
      invoiceNumber,
      customerName: customerName || 'Walk-in Customer',
      items: invoiceItems,
      subtotal,
      taxRate: 0, // No global tax rate anymore
      taxAmount: totalTaxAmount,
      grandTotal,
      totalAmount: grandTotal, // Keep for backward compatibility
      userId: req.user._id
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Restore inventory quantities
    if (invoice.items && invoice.items.length > 0) {
      for (const item of invoice.items) {
        // Try both itemId and inventoryItemId (for backward compatibility)
        const itemId = item.inventoryItemId || item.itemId;
        const quantityToRestore = item.quantity || 0;
        
        if (itemId && quantityToRestore > 0) {
          try {
            const inventoryItem = await InventoryItem.findById(itemId);
            if (inventoryItem) {
              inventoryItem.quantity = (inventoryItem.quantity || 0) + quantityToRestore;
              await inventoryItem.save();
            }
          } catch (itemError) {
            console.error(`Error restoring quantity for item ${itemId}:`, itemError);
            // Continue with other items even if one fails
          }
        }
      }
    }

    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ 
      message: 'Error deleting invoice',
      error: error.message 
    });
  }
});

module.exports = router;

