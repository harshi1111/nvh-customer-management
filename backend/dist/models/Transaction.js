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
const TransactionSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer ID is required']
    },
    projectId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = mongoose_1.default.model('Transaction', TransactionSchema);
