import mongoose from 'mongoose';

const estimateItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const estimateSchema = new mongoose.Schema({
  estimateNumber: {
    type: String,
    unique: true,
    trim: true,
  },
  customerName: {
    type: String,
    required: true,
    trim: true,
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  customerPhone: {
    type: String,
    trim: true,
  },
  projectTitle: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  validUntil: {
    type: Date,
  },
  items: {
    type: [estimateItemSchema],
    default: [],
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 16,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  additionalNotes: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'approved', 'rejected'],
    default: 'draft',
  },
  approvedAmount: {
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

// Generate estimate number before saving
estimateSchema.pre('save', async function(next) {
  if (!this.estimateNumber) {
    const count = await mongoose.model('Estimate').countDocuments({ userId: this.userId });
    this.estimateNumber = `EST-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Estimate', estimateSchema);

