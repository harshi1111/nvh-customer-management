"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextSerialNumber = exports.deleteTransaction = exports.updateTransaction = exports.createTransaction = exports.getTransactionById = exports.getCustomerTransactions = void 0;
const Transaction_1 = __importDefault(require("../models/Transaction"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Project_1 = __importDefault(require("../models/Project"));
const errorResponse_1 = require("../utils/errorResponse");
// Get all transactions for a customer (optionally filtered by project)
const getCustomerTransactions = async (req, res) => {
    try {
        const { projectId } = req.query;
        let where = { customerId: req.params.customerId };
        if (projectId && typeof projectId === 'string') {
            where.projectId = projectId;
        }
        const transactions = await Transaction_1.default.findAll({
            where,
            order: [['serialNumber', 'ASC']],
            include: [{
                    model: Project_1.default,
                    attributes: ['id', 'name']
                }],
            attributes: { exclude: ['__v'] }
        });
        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getCustomerTransactions = getCustomerTransactions;
// Get single transaction by ID
const getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction_1.default.findByPk(req.params.id, {
            include: [{
                    model: Project_1.default,
                    attributes: ['id', 'name']
                }],
            attributes: { exclude: ['__v'] }
        });
        if (!transaction) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Transaction not found', 404));
            return;
        }
        res.status(200).json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getTransactionById = getTransactionById;
// Create new transaction
const createTransaction = async (req, res) => {
    try {
        // Check if customer exists
        const customer = await Customer_1.default.findByPk(req.body.customerId);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        // Check if project exists
        const project = await Project_1.default.findByPk(req.body.projectId);
        if (!project) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Project not found', 404));
            return;
        }
        // Get next serial number
        const lastTransaction = await Transaction_1.default.findOne({
            where: {
                customerId: req.body.customerId,
                projectId: req.body.projectId
            },
            order: [['serialNumber', 'DESC']]
        });
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
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.createTransaction = createTransaction;
// Update transaction
const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction_1.default.findByPk(req.params.id);
        if (!transaction) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Transaction not found', 404));
            return;
        }
        await transaction.update(req.body);
        await transaction.reload();
        res.status(200).json({
            success: true,
            data: transaction
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.updateTransaction = updateTransaction;
// Delete transaction
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction_1.default.findByPk(req.params.id);
        if (!transaction) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Transaction not found', 404));
            return;
        }
        const { customerId, projectId } = transaction;
        await transaction.destroy();
        // Renumber remaining transactions
        const remainingTransactions = await Transaction_1.default.findAll({
            where: {
                customerId,
                projectId
            },
            order: [['serialNumber', 'ASC']]
        });
        // Update serial numbers
        for (let i = 0; i < remainingTransactions.length; i++) {
            if (remainingTransactions[i].serialNumber !== i + 1) {
                await remainingTransactions[i].update({ serialNumber: i + 1 });
            }
        }
        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully',
            data: {}
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.deleteTransaction = deleteTransaction;
// Get next serial number for a customer/project
const getNextSerialNumber = async (req, res) => {
    try {
        const { customerId, projectId } = req.params;
        const lastTransaction = await Transaction_1.default.findOne({
            where: { customerId, projectId },
            order: [['serialNumber', 'DESC']]
        });
        const nextSerial = lastTransaction ? lastTransaction.serialNumber + 1 : 1;
        res.status(200).json({
            success: true,
            data: { nextSerial }
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getNextSerialNumber = getNextSerialNumber;
