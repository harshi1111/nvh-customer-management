"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const encryption_1 = require("../utils/encryption");
const CustomerSchema = new mongoose_1.Schema({
    aadhaarNumber: {
        type: String,
        required: false, // Changed from true to false for encryption flexibility
        unique: true,
        trim: true,
        set: (value) => {
            if (value && encryption_1.AadhaarEncryption.validate(value)) {
                return encryption_1.AadhaarEncryption.encrypt(value);
            }
            return value;
        },
        get: (value) => {
            if (value && value.length > 20) { // Encrypted strings are longer
                return encryption_1.AadhaarEncryption.mask(encryption_1.AadhaarEncryption.decrypt(value));
            }
            return value;
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
            type: mongoose_1.Schema.Types.ObjectId,
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
CustomerSchema.index({ fullName: 'text', contactNumber: 'text' });
// Virtual for getting the original Aadhaar (decrypted) - use with caution
CustomerSchema.virtual('originalAadhaar').get(function () {
    const aadhaar = this.get('aadhaarNumber', null, { getters: false });
    if (aadhaar && aadhaar.length > 20) {
        return encryption_1.AadhaarEncryption.decrypt(aadhaar);
    }
    return aadhaar;
});
// Virtual for getting fully masked Aadhaar (XXXX-XXXX-1234)
CustomerSchema.virtual('maskedAadhaar').get(function () {
    const aadhaar = this.get('aadhaarNumber', null, { getters: false });
    if (aadhaar && aadhaar.length > 20) {
        return encryption_1.AadhaarEncryption.mask(encryption_1.AadhaarEncryption.decrypt(aadhaar));
    }
    return encryption_1.AadhaarEncryption.mask(aadhaar);
});
exports.default = mongoose_1.default.model('Customer', CustomerSchema);
