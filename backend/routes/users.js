import express from 'express';
import Employee from '../models/Employee.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all employees for user
router.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.userId }).sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single employee
router.get('/employees/:id', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.id, userId: req.userId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee
router.post('/employees', authenticate, async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;
    const employee = new Employee({
      name,
      email,
      phone,
      position,
      userId: req.userId,
    });
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update employee
router.put('/employees/:id', authenticate, async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;
    const employee = await Employee.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, email, phone, position },
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete employee
router.delete('/employees/:id', authenticate, async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

