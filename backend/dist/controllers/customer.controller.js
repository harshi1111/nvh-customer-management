"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateAadhaar = exports.getCustomerFinancialSummary = exports.toggleCustomerStatus = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const sequelize_1 = require("sequelize");
const crypto_1 = __importDefault(require("crypto"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Project_1 = __importDefault(require("../models/Project"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const errorResponse_1 = require("../utils/errorResponse");
// Get all customers - UPDATED FOR SEQUELIZE
const getAllCustomers = async (req, res) => {
    try {
        const { search, status } = req.query;
        // Build where clause for Sequelize
        const where = {};
        // Filter by status
        if (status && status !== 'all') {
            where.isActive = status === 'active';
        }
        // Search by name, phone, or Aadhaar
        if (search && typeof search === 'string') {
            where[sequelize_1.Op.or] = [
                { fullName: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { contactNumber: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { aadhaarNumber: { [sequelize_1.Op.iLike]: `%${search}%` } }
            ];
        }
        const customers = await Customer_1.default.findAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['__v'] } // Sequelize doesn't have __v
        });
        res.status(200).json({
            success: true,
            count: customers.length,
            data: customers
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getAllCustomers = getAllCustomers;
// Get single customer by ID - UPDATED FOR SEQUELIZE
const getCustomerById = async (req, res) => {
    try {
        const customer = await Customer_1.default.findByPk(req.params.id, {
            attributes: { exclude: ['__v'] },
            include: [{
                    model: Project_1.default,
                    attributes: ['id', 'name', 'status']
                }]
        });
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        // Get financial summary
        const transactions = await Transaction_1.default.findAll({
            where: { customerId: customer.id } // Use customer.id not customer._id
        });
        let totalDebit = 0;
        let totalCredit = 0;
        transactions.forEach((transaction) => {
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
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getCustomerById = getCustomerById;
// Create new customer - EFFICIENT DUPLICATE CHECK - UPDATED FOR SEQUELIZE
const createCustomer = async (req, res) => {
    try {
        console.log('=== CREATE CUSTOMER START ===');
        console.log('Received data:', {
            aadhaar: req.body.aadhaarNumber,
            name: req.body.fullName,
            contact: req.body.contactNumber
        });
        // Check if Aadhaar already exists - EFFICIENT VERSION
        if (req.body.aadhaarNumber) {
            const cleanAadhaar = req.body.aadhaarNumber.replace(/\s/g, '');
            // 1. Check by contact number (exact match)
            const existingByContact = await Customer_1.default.findOne({
                where: { contactNumber: req.body.contactNumber } // SEQUELIZE SYNTAX
            });
            if (existingByContact) {
                console.log('Duplicate found by contact number:', existingByContact.fullName);
                res.status(400).json((0, errorResponse_1.createErrorResponse)(`Customer with contact number ${req.body.contactNumber} already exists: ${existingByContact.fullName}`, 400));
                return;
            }
            // 2. Check by Aadhaar hash (if valid Aadhaar)
            if (/^\d{12}$/.test(cleanAadhaar)) {
                const aadhaarHash = crypto_1.default.createHash('sha256').update(cleanAadhaar).digest('hex');
                const existingByHash = await Customer_1.default.findOne({
                    where: { aadhaarHash } // SEQUELIZE SYNTAX
                });
                if (existingByHash) {
                    console.log('Duplicate found by Aadhaar hash:', existingByHash.fullName);
                    res.status(400).json((0, errorResponse_1.createErrorResponse)(`Customer with this Aadhaar already exists: ${existingByHash.fullName}`, 400));
                    return;
                }
            }
            // 3. Check by similar name (fuzzy match - optional but helpful)
            const existingByName = await Customer_1.default.findOne({
                where: {
                    fullName: { [sequelize_1.Op.iLike]: `%${req.body.fullName.substring(0, 3)}%` } // SEQUELIZE SYNTAX
                }
            });
            if (existingByName) {
                console.log('Possible duplicate by name:', existingByName.fullName);
                // Warn but don't block - names can be similar
                console.warn(`Warning: Similar name found: ${existingByName.fullName}`);
            }
        }
        console.log('No duplicates found, creating customer...');
        // Create the customer - SEQUELIZE SYNTAX
        const customer = await Customer_1.default.create({
            ...req.body
            // projects array is handled by associations, not needed here
        });
        console.log('Customer created successfully:', customer.fullName);
        res.status(201).json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.createCustomer = createCustomer;
// Update customer - UPDATED FOR SEQUELIZE
const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer_1.default.findByPk(req.params.id);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        // Update customer with new data
        await customer.update(req.body);
        // Reload to get updated data with associations if needed
        await customer.reload();
        res.status(200).json({
            success: true,
            data: customer
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.updateCustomer = updateCustomer;
// Delete customer - UPDATED FOR SEQUELIZE
const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer_1.default.findByPk(req.params.id);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        // Delete customer's projects - SEQUELIZE SYNTAX
        await Project_1.default.destroy({
            where: { customerId: customer.id } // Use customer.id not customer._id
        });
        // Delete customer's transactions - SEQUELIZE SYNTAX
        await Transaction_1.default.destroy({
            where: { customerId: customer.id } // Use customer.id not customer._id
        });
        // Delete customer
        await customer.destroy();
        res.status(200).json({
            success: true,
            message: 'Customer deleted successfully',
            data: {}
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.deleteCustomer = deleteCustomer;
// Toggle customer active status - UPDATED FOR SEQUELIZE
const toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer_1.default.findByPk(req.params.id);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
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
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.toggleCustomerStatus = toggleCustomerStatus;
// Get customer financial summary - UPDATED FOR SEQUELIZE
const getCustomerFinancialSummary = async (req, res) => {
    try {
        const { projectId } = req.query;
        let where = { customerId: req.params.id };
        if (projectId && typeof projectId === 'string') {
            where.projectId = projectId;
        }
        const transactions = await Transaction_1.default.findAll({
            where
        });
        let totalDebit = 0;
        let totalCredit = 0;
        transactions.forEach((transaction) => {
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
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getCustomerFinancialSummary = getCustomerFinancialSummary;
// Check duplicate Aadhaar - UPDATED FOR SEQUELIZE
const checkDuplicateAadhaar = async (req, res) => {
    try {
        const { aadhaar } = req.params;
        const { exclude } = req.query;
        // Ensure aadhaar is a string (Express params can sometimes be arrays)
        const aadhaarString = Array.isArray(aadhaar) ? aadhaar[0] : aadhaar;
        if (!aadhaarString || aadhaarString.length !== 12) {
            res.status(400).json((0, errorResponse_1.createErrorResponse)('Invalid Aadhaar number', 400));
            return;
        }
        const cleanAadhaar = aadhaarString.replace(/\s/g, '');
        // Create hash for the provided Aadhaar
        const aadhaarHash = crypto_1.default.createHash('sha256').update(cleanAadhaar).digest('hex');
        // Build where clause
        const where = { aadhaarHash };
        // Exclude current customer if provided (for updates)
        if (exclude && typeof exclude === 'string') {
            where.id = { [sequelize_1.Op.ne]: exclude };
        }
        // Check for duplicate
        const existingCustomer = await Customer_1.default.findOne({
            where,
            attributes: ['id', 'fullName', 'contactNumber']
        });
        if (existingCustomer) {
            res.status(200).json({
                exists: true,
                customerName: existingCustomer.fullName,
                contactNumber: existingCustomer.contactNumber
            });
            return;
        }
        res.status(200).json({
            exists: false
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.checkDuplicateAadhaar = checkDuplicateAadhaar;
