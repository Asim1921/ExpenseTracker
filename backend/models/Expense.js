import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['payroll', 'operating', 'material'],
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  // Payroll specific fields
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  daysWorked: {
    type: Number,
    default: 0,
  },
  advancement: {
    type: Number,
    default: 0,
  },
  weekStart: {
    type: Date,
  },
  weekend: {
    type: Date,
  },
  // Material specific fields
  returnAmount: {
    type: Number,
    default: 0,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Expense', expenseSchema);

