import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto'; // Added import
import { AadhaarEncryption } from '../utils/encryption';

export interface ICustomer extends Document {
  aadhaarNumber: string;
  aadhaarHash: string; // Added field to interface
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  address: string;
  contactNumber: string;
  email: string;
  profileImage?: string;
  isActive: boolean;
  projects: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema({
  aadhaarNumber: {
    type: String,
    required: false, // Changed from true to false for encryption flexibility
    unique: true,
    trim: true,
    set: (value: string) => {
      if (value && AadhaarEncryption.validate(value)) {
        return AadhaarEncryption.encrypt(value);
      }
      return value;
    },
    get: (value: string) => {
      if (value && value.length > 20) { // Encrypted strings are longer
        return AadhaarEncryption.mask(AadhaarEncryption.decrypt(value));
      }
      return value;
    }
  },
  aadhaarHash: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
    trim: true,
    set: function(value: string) {
      if (!value) return null;
      const cleanAadhaar = value.replace(/\s/g, '');
      // Create a deterministic hash for duplicate checking
      return crypto.createHash('sha256').update(cleanAadhaar).digest('hex');
    }
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [3, 'Full name must be at least 3 characters']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: String,
    required: [true, 'Date of birth is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    minlength: [10, 'Contact number must be 10 digits'],
    maxlength: [10, 'Contact number must be 10 digits']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  profileImage: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'Project',
    default: []
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Enable getters when converting to JSON
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Create indexes for faster queries
CustomerSchema.index({ aadhaarNumber: 1 }, { unique: true });
CustomerSchema.index({ aadhaarHash: 1 }, { unique: true, sparse: true }); // Added index for aadhaarHash
CustomerSchema.index({ fullName: 'text', contactNumber: 'text' });

// Virtual for getting the original Aadhaar (decrypted) - use with caution
CustomerSchema.virtual('originalAadhaar').get(function(this: ICustomer) {
  const aadhaar = this.get('aadhaarNumber', null, { getters: false });
  if (aadhaar && aadhaar.length > 20) {
    return AadhaarEncryption.decrypt(aadhaar);
  }
  return aadhaar;
});

// Virtual for getting fully masked Aadhaar (XXXX-XXXX-1234)
CustomerSchema.virtual('maskedAadhaar').get(function(this: ICustomer) {
  const aadhaar = this.get('aadhaarNumber', null, { getters: false });
  if (aadhaar && aadhaar.length > 20) {
    return AadhaarEncryption.mask(AadhaarEncryption.decrypt(aadhaar));
  }
  return AadhaarEncryption.mask(aadhaar);
});

export default mongoose.model<ICustomer>('Customer', CustomerSchema);