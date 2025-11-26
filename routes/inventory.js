const express = require('express');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all inventory items for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const items = await InventoryItem.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory items' });
  }
});

// Get single inventory item
router.get('/:id', auth, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item' });
  }
});

// Create inventory item
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, weight, purity, purchasePrice, sellingPrice, quantity } = req.body;

    // Only name and quantity are required
    if (!name || quantity === undefined || quantity === null || quantity === '') {
      return res.status(400).json({ message: 'Name and quantity are required fields' });
    }

    // Convert empty strings to undefined for optional fields
    const itemData = {
      name,
      quantity: Number(quantity),
      userId: req.user._id
    };

    if (category && category.trim() !== '') itemData.category = category.trim();
    if (weight !== undefined && weight !== null && weight !== '') itemData.weight = Number(weight);
    if (purity && purity.trim() !== '') itemData.purity = purity.trim();
    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== '') itemData.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') itemData.sellingPrice = Number(sellingPrice);

    const item = new InventoryItem(itemData);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ message: 'Error creating inventory item' });
  }
});

// Update inventory item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await InventoryItem.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { name, category, weight, purity, purchasePrice, sellingPrice, quantity } = req.body;
    
    // Name and quantity are required
    if (name !== undefined && name !== null && name !== '') {
      item.name = name;
    }
    if (quantity !== undefined && quantity !== null && quantity !== '') {
      item.quantity = Number(quantity);
    }

    // Optional fields - can be set to empty/null
    if (category !== undefined) {
      item.category = category && category.trim() !== '' ? category.trim() : undefined;
    }
    if (weight !== undefined && weight !== null && weight !== '') {
      item.weight = Number(weight);
    } else if (weight === null || weight === '') {
      item.weight = undefined;
    }
    if (purity !== undefined) {
      item.purity = purity && purity.trim() !== '' ? purity.trim() : undefined;
    }
    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== '') {
      item.purchasePrice = Number(purchasePrice);
    } else if (purchasePrice === null || purchasePrice === '') {
      item.purchasePrice = undefined;
    }
    if (sellingPrice !== undefined && sellingPrice !== null && sellingPrice !== '') {
      item.sellingPrice = Number(sellingPrice);
    } else if (sellingPrice === null || sellingPrice === '') {
      item.sellingPrice = undefined;
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Error updating inventory item' });
  }
});

// Delete inventory item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await InventoryItem.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
});

module.exports = router;

