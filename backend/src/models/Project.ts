import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  customerId: mongoose.Types.ObjectId;
  name: string;
  location: {
    country: string;
    state: string;
    city: string;
    village: string;
  };
  numberOfBags: number;
  area: {
    value: number;
    unit: 'acres' | 'cent';
  };
  status: 'active' | 'completed' | 'planned';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  location: {
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'India'
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    village: {
      type: String,
      default: ''
    }
  },
  numberOfBags: {
    type: Number,
    required: [true, 'Number of bags is required'],
    min: [0, 'Number of bags cannot be negative'],
    default: 0
  },
  area: {
    value: {
      type: Number,
      required: [true, 'Area value is required'],
      min: [0, 'Area cannot be negative']
    },
    unit: {
      type: String,
      enum: ['acres', 'cent'],
      default: 'acres'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'planned'],
    default: 'active'
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

// Index for faster customer project queries
ProjectSchema.index({ customerId: 1 });
ProjectSchema.index({ status: 1 });

export default mongoose.model<IProject>('Project', ProjectSchema);