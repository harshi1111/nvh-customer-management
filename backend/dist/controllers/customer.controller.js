"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerFinancialSummary = exports.toggleCustomerStatus = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const Customer_1 = __importDefault(require("../models/Customer"));
const Project_1 = __importDefault(require("../models/Project"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
// Get all customers
const getAllCustomers = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};
        // Filter by status
        if (status && status !== 'all') {
            query.isActive = status === 'active';
        }
        // Search by name, phone, or Aadhaar
        if (search && typeof search === 'string') {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { contactNumber: { $regex: search, $options: 'i' } },
                { aadhaarNumber: { $regex: search, $options: 'i' } }
            ];
        }
        const customers = await Customer_1.default.find(query)
            .sort({ createdAt: -1 })
            .select('-__v');
        res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
    }
    catch (error) {
        console.error('Get all customers error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getAllCustomers = getAllCustomers;
// Get single customer by ID
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id)
            .select('-__v')
            .populate('projects', 'name status');
        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
            return;
        }
        // Get financial summary
        const transactions = await Transaction_1.default.find({ customerId: customer._id });
        let totalDebit = 0;
        let totalCredit = 0;
        transactions.forEach(transaction => {
            totalDebit += transaction.debitAmount;
            totalCredit += transaction.creditAmount;
        });
        const financialSummary = {
            totalDebit,
            totalCredit,
            balance: totalCredit - totalDebit,
            transactionCount: transactions.length
        };
        res.status(200).json({
            success: true,
            data: {
                customer,
                financialSummary
            }
        });
    }
    catch (error) {
        console.error('Get customer by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getCustomerById = getCustomerById;
// Create new customer
const createCustomer = async (req, res) => {
    try {
        // Check if Aadhaar already exists
        const existingCustomer = await Customer_1.default.findOne({
            aadhaarNumber: req.body.aadhaarNumber
        });
        if (existingCustomer) {
            res.status(400).json({
                success: false,
                error: 'Customer with this Aadhaar number already exists'
            });
            return;
        }
        const customerData = {
            ...req.body,
            projects: []
        };
        const customer = await Customer_1.default.create(customerData);
        res.status(201).json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        console.error('Create customer error:', error);
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
exports.createCustomer = createCustomer;
// Update customer
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-__v');
        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        console.error('Update customer error:', error);
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
exports.updateCustomer = updateCustomer;
// Delete customer
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id);
        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
            return;
        }
        // Delete customer's projects
        await Project_1.default.deleteMany({ customerId: customer._id });
        // Delete customer's transactions
        await Transaction_1.default.deleteMany({ customerId: customer._id });
        // Delete customer
        await customer.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully',
            data: {}
        });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.deleteCustomer = deleteCustomer;
// Toggle customer active status
const toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer_1.default.findById(req.params.id);
        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
            return;
        }
        customer.isActive = !customer.isActive;
        await customer.save();
        res.status(200).json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        console.error('Toggle customer status error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.toggleCustomerStatus = toggleCustomerStatus;
// Get customer financial summary
const getCustomerFinancialSummary = async (req, res) => {
    try {
        const { projectId } = req.query;
        let query = { customerId: req.params.id };
        if (projectId && typeof projectId === 'string') {
            query.projectId = projectId;
        }
        const transactions = await Transaction_1.default.find(query);
        let totalDebit = 0;
        let totalCredit = 0;
        transactions.forEach(transaction => {
            totalDebit += transaction.debitAmount;
            totalCredit += transaction.creditAmount;
        });
        res.status(200).json({
            success: true,
            data: {
                totalDebit,
                totalCredit,
                balance: totalCredit - totalDebit,
                transactionCount: transactions.length
            }
        });
    }
    catch (error) {
        console.error('Get financial summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getCustomerFinancialSummary = getCustomerFinancialSummary;
