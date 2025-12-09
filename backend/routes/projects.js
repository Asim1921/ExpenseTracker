import express from 'express';
import Project from '../models/Project.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all projects for user
router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.userId });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create project
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, grossIncome, profitSharingEnabled, profitSharingType, profitShares } = req.body;
    const project = new Project({
      name,
      grossIncome: grossIncome || 0,
      profitSharingEnabled: profitSharingEnabled || false,
      profitSharingType: profitSharingType || 'none',
      profitShares: profitShares || [],
      userId: req.userId,
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update project
router.put('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete project
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

