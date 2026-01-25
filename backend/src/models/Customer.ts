import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';
import { AadhaarEncryption } from '../utils/encryption';

export interface ICustomer extends Document {
  aadhaarNumber: string;
  aadhaarHash: string;
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
    required: false,
    unique: true,
    trim: true,
    set: (value: string) => {
      if (!value) return value; // Return null/undefined as is
      
      const cleanValue = value.replace(/\s/g, '');
      
      // Only encrypt if it looks like an Aadhaar (12 digits)
      if (/^\d{12}$/.test(cleanValue)) {
        return AadhaarEncryption.encrypt(cleanValue);
      }
      
      // For invalid formats, still encrypt but mark as invalid
      // This ensures ALL sensitive data is encrypted
      console.warn(`Storing invalid Aadhaar format: ${value.substring(0, 4)}...`);
      return AadhaarEncryption.encrypt(`INVALID-${cleanValue}`);
    },
    get: (value: string) => {
      if (!value) return value;
      
      try {
        // Try to decrypt and validate
        const decrypted = AadhaarEncryption.decrypt(value);
        
        // Check if it was marked as invalid
        if (decrypted.startsWith('INVALID-')) {
          const original = decrypted.replace('INVALID-', '');
          return AadhaarEncryption.mask(original) + ' (Invalid Format)';
        }
        
        // Valid Aadhaar
        return AadhaarEncryption.mask(decrypted);
      } catch (error) {
        // If decryption fails, it might be unencrypted (old data)
        console.warn('Failed to decrypt Aadhaar, returning as-is');
        return value.length === 12 ? AadhaarEncryption.mask(value) : value;
      }
    }
  },
  aadhaarHash: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    set: function(value: string) {
      if (!value) return null;
      const cleanAadhaar = value.replace(/\s/g, '');
      
      // Don't create hash for invalid Aadhaar
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        return null;
      }
      
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
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Create indexes for faster queries
CustomerSchema.index({ fullName: 'text', contactNumber: 'text' });

// Virtual for getting the original Aadhaar (decrypted) - use with caution
CustomerSchema.virtual('originalAadhaar').get(function(this: ICustomer) {
  const aadhaar = this.get('aadhaarNumber', null, { getters: false });
  if (!aadhaar) return null;
  
  try {
    const decrypted = AadhaarEncryption.decrypt(aadhaar);
    // Remove INVALID- prefix if present
    return decrypted.startsWith('INVALID-') 
      ? decrypted.replace('INVALID-', '') 
      : decrypted;
  } catch (error) {
    console.warn('Failed to decrypt for originalAadhaar');
    return aadhaar;
  }
});

// Virtual for getting fully masked Aadhaar (XXXX-XXXX-1234)
CustomerSchema.virtual('maskedAadhaar').get(function(this: ICustomer) {
  const aadhaar = this.get('aadhaarNumber', null, { getters: false });
  if (!aadhaar) return null;
  
  try {
    const decrypted = AadhaarEncryption.decrypt(aadhaar);
    if (decrypted.startsWith('INVALID-')) {
      const original = decrypted.replace('INVALID-', '');
      return AadhaarEncryption.mask(original) + ' (Invalid Format)';
    }
    return AadhaarEncryption.mask(decrypted);
  } catch (error) {
    return aadhaar.length === 12 ? AadhaarEncryption.mask(aadhaar) : aadhaar;
  }
});

// Virtual to check if stored Aadhaar is valid format
CustomerSchema.virtual('isValidAadhaarFormat').get(function(this: ICustomer) {
  const aadhaar = this.get('aadhaarNumber', null, { getters: false });
  if (!aadhaar) return false;
  
  try {
    const decrypted = AadhaarEncryption.decrypt(aadhaar);
    return !decrypted.startsWith('INVALID-') && /^\d{12}$/.test(decrypted);
  } catch (error) {
    return /^\d{12}$/.test(aadhaar);
  }
});

export default mongoose.model<ICustomer>('Customer', CustomerSchema);