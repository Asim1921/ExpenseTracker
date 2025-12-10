import express from 'express';
import Expense from '../models/Expense.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all expenses for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, projectId, employeeId, startDate, endDate } = req.query;
    const query = { userId: req.userId };
    if (type) query.type = type;
    if (projectId) query.projectId = projectId;
    if (employeeId) query.employeeId = employeeId;
    
    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const expenses = await Expense.find(query)
      .populate('projectId', 'name')
      .populate('employeeId', 'name')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create expense
router.post('/', authenticate, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      userId: req.userId,
    };

    // Remove empty strings for optional ObjectId fields
    if (expenseData.employeeId === '' || expenseData.employeeId === null) {
      delete expenseData.employeeId;
    }

    const expense = new Expense(expenseData);
    await expense.save();
    await expense.populate('projectId', 'name');
    await expense.populate('employeeId', 'name');
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update expense
router.put('/:id', authenticate, async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Remove empty strings for optional ObjectId fields
    if (updateData.employeeId === '' || updateData.employeeId === null) {
      delete updateData.employeeId;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    ).populate('projectId', 'name').populate('employeeId', 'name');
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

