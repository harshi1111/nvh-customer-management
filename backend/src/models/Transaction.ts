import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseType = 
  | 'LABOUR_CHARGES'
  | 'SPRINKLER_INSTALLATION'
  | 'TRANSPORT'
  | 'FOOD'
  | 'PLOUGHING'
  | 'TRACTOR'
  | 'COW_GOAT_DUNG'
  | 'INVESTMENT';

export interface ITransaction extends Document {
  customerId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  serialNumber: number;
  expenseType: ExpenseType;
  quantity?: number;
  unit?: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  serialNumber: {
    type: Number,
    required: [true, 'Serial number is required'],
    min: [1, 'Serial number must be at least 1']
  },
  expenseType: {
    type: String,
    enum: [
      'LABOUR_CHARGES',
      'SPRINKLER_INSTALLATION',
      'TRANSPORT',
      'FOOD',
      'PLOUGHING',
      'TRACTOR',
      'COW_GOAT_DUNG',
      'INVESTMENT'
    ],
    required: [true, 'Expense type is required']
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  unit: {
    type: String,
    trim: true
  },
  debitAmount: {
    type: Number,
    required: [true, 'Debit amount is required'],
    min: [0, 'Debit amount cannot be negative'],
    default: 0
  },
  creditAmount: {
    type: Number,
    required: [true, 'Credit amount is required'],
    min: [0, 'Credit amount cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for customer+project transactions
TransactionSchema.index({ customerId: 1, projectId: 1 });
TransactionSchema.index({ customerId: 1, projectId: 1, serialNumber: 1 }, { unique: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);