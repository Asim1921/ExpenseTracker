import express from 'express';
import Employee from '../models/Employee.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all employees for user
router.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await Employee.find({ userId: req.userId });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee
router.post('/employees', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const employee = new Employee({
      name,
      userId: req.userId,
    });
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

