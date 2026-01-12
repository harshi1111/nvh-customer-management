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
const ProjectSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Project', ProjectSchema);
