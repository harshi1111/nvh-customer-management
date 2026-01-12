"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextSerialNumber = exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransactionById = exports.getCustomerTransactions = void 0;
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Project_1 = __importDefault(require("../models/Project"));
// Get all transactions for a customer (optionally filtered by project)
const getCustomerTransactions = async (req, res) => {
    try {
        const { projectId } = req.query;
        let query = { customerId: req.params.customerId };
        if (projectId && typeof projectId === 'string') {
            query.projectId = projectId;
        }
        const transactions = await Transaction_1.default.find(query)
            .sort({ serialNumber: 1 })
            .populate('projectId', 'name')
            .select('-__v');
        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    }
    catch (error) {
        console.error('Get customer transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getCustomerTransactions = getCustomerTransactions;
// Get single transaction by ID
const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction_1.default.findById(req.params.id)
            .populate('projectId', 'name')
            .select('-__v');
        if (!transaction) {
            res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        console.error('Get transaction by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getTransactionById = getTransactionById;
// Create new transaction
const createTransaction = async (req, res) => {
    try {
        // Check if customer exists
        const customer = await Customer_1.default.findById(req.body.customerId);
        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
            return;
        }
        // Check if project exists
        const project = await Project_1.default.findById(req.body.projectId);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found'
            });
            return;
        }
        // Get next serial number
        const lastTransaction = await Transaction_1.default.findOne({ customerId: req.body.customerId, projectId: req.body.projectId }, {}, { sort: { serialNumber: -1 } });
        const nextSerial = lastTransaction ? lastTransaction.serialNumber + 1 : 1;
        const transactionData = {
            ...req.body,
            serialNumber: nextSerial
        };
        const transaction = await Transaction_1.default.create(transactionData);
        res.status(201).json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        console.error('Create transaction error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }
        else if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'Duplicate serial number for this customer and project'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Server error'
            });
        }
    }
};
exports.createTransaction = createTransaction;
// Update transaction
const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-__v');
        if (!transaction) {
            res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        console.error('Update transaction error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Server error'
            });
        }
    }
};
exports.updateTransaction = updateTransaction;
// Delete transaction
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction_1.default.findById(req.params.id);
        if (!transaction) {
            res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
            return;
        }
        await transaction.deleteOne();
        // Renumber remaining transactions
        const remainingTransactions = await Transaction_1.default.find({
            customerId: transaction.customerId,
            projectId: transaction.projectId
        }).sort({ serialNumber: 1 });
        // Update serial numbers
        for (let i = 0; i < remainingTransactions.length; i++) {
            if (remainingTransactions[i].serialNumber !== i + 1) {
                remainingTransactions[i].serialNumber = i + 1;
                await remainingTransactions[i].save();
            }
        }
        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully',
            data: {}
        });
    }
    catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.deleteTransaction = deleteTransaction;
// Get next serial number for a customer/project
const getNextSerialNumber = async (req, res) => {
    try {
        const { customerId, projectId } = req.params;
        const lastTransaction = await Transaction_1.default.findOne({ customerId, projectId }, {}, { sort: { serialNumber: -1 } });
        const nextSerial = lastTransaction ? lastTransaction.serialNumber + 1 : 1;
        res.status(200).json({
            success: true,
            data: { nextSerial }
        });
    }
    catch (error) {
        console.error('Get next serial number error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getNextSerialNumber = getNextSerialNumber;
