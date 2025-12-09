import express from 'express';
import Expense from '../models/Expense.js';
import Project from '../models/Project.js';
import Employee from '../models/Employee.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to convert data to CSV
function convertToCSV(data, headers) {
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      let value = row[header];
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = '';
      }
      // Handle dates
      else if (value instanceof Date) {
        value = value.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      // Handle arrays (like profitShares)
      else if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      // Handle objects
      else if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      // Convert to string
      else {
        value = String(value);
      }
      
      // Escape commas, quotes, and newlines in values
      if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

// Export all data (year-end export)
router.get('/all', authenticate, async (req, res) => {
  try {
    const { format = 'json', year } = req.query;
    
    // Get all data for the user
    const [projects, expenses, employees] = await Promise.all([
      Project.find({ userId: req.userId }),
      Expense.find({ userId: req.userId })
        .populate('projectId', 'name')
        .populate('employeeId', 'name')
        .sort({ createdAt: -1 }),
      Employee.find({ userId: req.userId }),
    ]);

    // Filter by year if provided
    let filteredExpenses = expenses;
    if (year) {
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31T23:59:59`);
      filteredExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.createdAt);
        return expDate >= yearStart && expDate <= yearEnd;
      });
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      year: year || 'all',
      projects: projects.map(p => ({
        id: p._id,
        name: p.name || '',
        grossIncome: p.grossIncome || 0,
        profitSharingEnabled: p.profitSharingEnabled || false,
        profitSharingType: p.profitSharingType || 'none',
        profitShares: p.profitShares && Array.isArray(p.profitShares) ? p.profitShares.map((s) => `${s.name || 'Partner'}: ${s.percentage || 0}%`).join('; ') : '',
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
      })),
      expenses: filteredExpenses.map(e => ({
        id: e._id,
        type: e.type,
        project: e.projectId?.name || 'N/A',
        category: e.category || '',
        description: e.description || '',
        amount: e.amount || 0,
        employee: e.employeeId?.name || 'N/A',
        daysWorked: e.daysWorked || 0,
        advancement: e.advancement || 0,
        weekStart: e.weekStart ? new Date(e.weekStart).toISOString().split('T')[0] : '',
        weekend: e.weekend ? new Date(e.weekend).toISOString().split('T')[0] : '',
        returnAmount: e.returnAmount || 0,
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : '',
      })),
      employees: employees.map(emp => ({
        id: emp._id,
        name: emp.name || '',
        createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString().split('T')[0] : '',
      })),
    };

    if (format === 'csv') {
      // Export as CSV
      const csvData = [];
      
      // Projects CSV
      csvData.push('=== PROJECTS ===');
      csvData.push(convertToCSV(exportData.projects, ['name', 'grossIncome', 'profitSharingEnabled', 'profitSharingType', 'profitShares', 'createdAt']));
      csvData.push('');
      
      // Expenses CSV
      csvData.push('=== EXPENSES ===');
      csvData.push(convertToCSV(exportData.expenses, ['type', 'project', 'category', 'description', 'amount', 'employee', 'daysWorked', 'advancement', 'weekStart', 'weekend', 'returnAmount', 'createdAt']));
      csvData.push('');
      
      // Employees CSV
      csvData.push('=== EMPLOYEES ===');
      csvData.push(convertToCSV(exportData.employees, ['name', 'createdAt']));
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="expense-tracking-export-${year || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + csvData.join('\n')); // Add BOM for Excel compatibility
    } else {
      // Export as JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="expense-tracking-export-${year || 'all'}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export expenses by type
router.get('/expenses/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json', year } = req.query;
    
    if (!['payroll', 'operating', 'material'].includes(type)) {
      return res.status(400).json({ message: 'Invalid expense type' });
    }

    let query = { userId: req.userId, type };
    
    // Filter by year if provided
    if (year) {
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31T23:59:59`);
      query.createdAt = { $gte: yearStart, $lte: yearEnd };
    }

    const expenses = await Expense.find(query)
      .populate('projectId', 'name')
      .populate('employeeId', 'name')
      .sort({ createdAt: -1 });

    const exportData = expenses.map(e => ({
      id: e._id,
      type: e.type,
      project: e.projectId?.name || 'N/A',
      category: e.category || '',
      description: e.description || '',
      amount: e.amount || 0,
      employee: e.employeeId?.name || 'N/A',
      daysWorked: e.daysWorked || 0,
      advancement: e.advancement || 0,
      weekStart: e.weekStart ? new Date(e.weekStart).toISOString().split('T')[0] : '',
      weekend: e.weekend ? new Date(e.weekend).toISOString().split('T')[0] : '',
      returnAmount: e.returnAmount || 0,
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : '',
    }));

    if (format === 'csv') {
      const headers = type === 'payroll' 
        ? ['project', 'employee', 'category', 'description', 'daysWorked', 'amount', 'advancement', 'weekStart', 'weekend', 'createdAt']
        : type === 'material'
        ? ['project', 'category', 'description', 'amount', 'returnAmount', 'createdAt']
        : ['project', 'category', 'description', 'amount', 'createdAt'];
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-expenses-${year || 'all'}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send('\ufeff' + convertToCSV(exportData, headers)); // Add BOM for Excel compatibility
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-expenses-${year || 'all'}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

