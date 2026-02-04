"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicateAadhaar = exports.getCustomerFinancialSummary = exports.toggleCustomerStatus = exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const sequelize_1 = require("sequelize");
const crypto_1 = __importDefault(require("crypto"));
const postgres_1 = __importDefault(require("../config/postgres"));
const errorResponse_1 = require("../utils/errorResponse");
// Get the typed models from sequelize
const CustomerModel = postgres_1.default.models.Customer;
const ProjectModel = postgres_1.default.models.Project;
const TransactionModel = postgres_1.default.models.Transaction;
// Get all customers - FIXED WITH TYPING
const getAllCustomers = async (req, res) => {
    try {
        const { search, status } = req.query;
        const where = {};
        if (status && status !== 'all') {
            where.isActive = status === 'active';
        }
        if (search && typeof search === 'string') {
            where[sequelize_1.Op.or] = [
                { fullName: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { contactNumber: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { aadhaarNumber: { [sequelize_1.Op.iLike]: `%${search}%` } }
            ];
        }
        const customers = await CustomerModel.findAll({
            where,
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['__v'] }
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
// Get single customer by ID - FIXED WITH TYPING
const getCustomerById = async (req, res) => {
    try {
        const customer = await CustomerModel.findByPk(req.params.id, {
            attributes: { exclude: ['__v'] },
            include: [{
                    model: ProjectModel,
                    attributes: ['id', 'name', 'status']
                }]
        });
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        const transactions = await TransactionModel.findAll({
            where: { customerId: customer.id }
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
// Create new customer - FIXED WITH TYPING
const createCustomer = async (req, res) => {
    try {
        console.log('=== CREATE CUSTOMER START ===');
        console.log('Received data:', {
            aadhaar: req.body.aadhaarNumber,
            name: req.body.fullName,
            contact: req.body.contactNumber
        });
        if (req.body.aadhaarNumber) {
            const cleanAadhaar = req.body.aadhaarNumber.replace(/\s/g, '');
            const existingByContact = await CustomerModel.findOne({
                where: { contactNumber: req.body.contactNumber }
            });
            if (existingByContact) {
                console.log('Duplicate found by contact number:', existingByContact.fullName);
                res.status(400).json((0, errorResponse_1.createErrorResponse)(`Customer with contact number ${req.body.contactNumber} already exists: ${existingByContact.fullName}`, 400));
                return;
            }
            if (/^\d{12}$/.test(cleanAadhaar)) {
                const aadhaarHash = crypto_1.default.createHash('sha256').update(cleanAadhaar).digest('hex');
                const existingByHash = await CustomerModel.findOne({
                    where: { aadhaarHash }
                });
                if (existingByHash) {
                    console.log('Duplicate found by Aadhaar hash:', existingByHash.fullName);
                    res.status(400).json((0, errorResponse_1.createErrorResponse)(`Customer with this Aadhaar already exists: ${existingByHash.fullName}`, 400));
                    return;
                }
            }
            const existingByName = await CustomerModel.findOne({
                where: {
                    fullName: { [sequelize_1.Op.iLike]: `%${req.body.fullName.substring(0, 3)}%` }
                }
            });
            if (existingByName) {
                console.log('Possible duplicate by name:', existingByName.fullName);
                console.warn(`Warning: Similar name found: ${existingByName.fullName}`);
            }
        }
        console.log('No duplicates found, creating customer...');
        const customer = await CustomerModel.create({
            ...req.body
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
// Update customer - FIXED WITH TYPING
const updateCustomer = async (req, res) => {
    try {
        const customer = await CustomerModel.findByPk(req.params.id);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        await customer.update(req.body);
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
// Delete customer - FIXED WITH TYPING
const deleteCustomer = async (req, res) => {
    try {
        const customer = await CustomerModel.findByPk(req.params.id);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        await ProjectModel.destroy({
            where: { customerId: customer.id }
        });
        await TransactionModel.destroy({
            where: { customerId: customer.id }
        });
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
// Toggle customer active status - FIXED WITH TYPING
const toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await CustomerModel.findByPk(req.params.id);
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
// Get customer financial summary - FIXED WITH TYPING
const getCustomerFinancialSummary = async (req, res) => {
    try {
        const { projectId } = req.query;
        let where = { customerId: req.params.id };
        if (projectId && typeof projectId === 'string') {
            where.projectId = projectId;
        }
        const transactions = await TransactionModel.findAll({
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
// Check duplicate Aadhaar - FIXED WITH TYPING
const checkDuplicateAadhaar = async (req, res) => {
    try {
        const { aadhaar } = req.params;
        const { exclude } = req.query;
        const aadhaarString = Array.isArray(aadhaar) ? aadhaar[0] : aadhaar;
        if (!aadhaarString || aadhaarString.length !== 12) {
            res.status(400).json((0, errorResponse_1.createErrorResponse)('Invalid Aadhaar number', 400));
            return;
        }
        const cleanAadhaar = aadhaarString.replace(/\s/g, '');
        const aadhaarHash = crypto_1.default.createHash('sha256').update(cleanAadhaar).digest('hex');
        const where = { aadhaarHash };
        if (exclude && typeof exclude === 'string') {
            where.id = { [sequelize_1.Op.ne]: exclude };
        }
        const existingCustomer = await CustomerModel.findOne({
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
