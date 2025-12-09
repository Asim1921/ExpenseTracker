import mongoose from 'mongoose';

const profitShareSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  grossIncome: {
    type: Number,
    required: true,
    default: 0,
  },
  // Profit sharing configuration
  profitSharingEnabled: {
    type: Boolean,
    default: false,
  },
  profitSharingType: {
    type: String,
    enum: ['none', 'two-way', 'three-way', 'custom'],
    default: 'none',
  },
  profitShares: {
    type: [profitShareSchema],
    default: [],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Project', projectSchema);

