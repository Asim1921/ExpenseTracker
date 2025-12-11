import express from 'express';
import Estimate from '../models/Estimate.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all estimates for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { userId: req.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { projectTitle: { $regex: search, $options: 'i' } },
        { estimateNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const estimates = await Estimate.find(query).sort({ createdAt: -1 });
    res.json(estimates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single estimate
router.get('/:id', authenticate, async (req, res) => {
  try {
    const estimate = await Estimate.findOne({ _id: req.params.id, userId: req.userId });
    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }
    res.json(estimate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create estimate
router.post('/', authenticate, async (req, res) => {
  try {
    const estimateData = {
      ...req.body,
      userId: req.userId,
    };

    // Calculate totals
    if (estimateData.items && Array.isArray(estimateData.items)) {
      estimateData.items = estimateData.items.map(item => ({
        ...item,
        total: (item.amount || 1) * (item.unitPrice || 0),
      }));
      
      estimateData.subtotal = estimateData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      estimateData.taxAmount = (estimateData.subtotal * (estimateData.taxRate || 16)) / 100;
      estimateData.total = estimateData.subtotal + estimateData.taxAmount;
    }

    const estimate = new Estimate(estimateData);
    await estimate.save();
    res.status(201).json(estimate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update estimate
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Recalculate totals if items are updated
    if (updateData.items && Array.isArray(updateData.items)) {
      updateData.items = updateData.items.map(item => ({
        ...item,
        total: (item.amount || 1) * (item.unitPrice || 0),
      }));
      
      updateData.subtotal = updateData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      updateData.taxAmount = (updateData.subtotal * (updateData.taxRate || 16)) / 100;
      updateData.total = updateData.subtotal + updateData.taxAmount;
    }

    const estimate = await Estimate.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }
    res.json(estimate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete estimate
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const estimate = await Estimate.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!estimate) {
      return res.status(404).json({ message: 'Estimate not found' });
    }
    res.json({ message: 'Estimate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

