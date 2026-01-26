"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = express_1.default.Router();
// GET /api/transactions/customer/:customerId - Get all transactions for a customer
router.get('/customer/:customerId', transaction_controller_1.getCustomerTransactions);
// GET /api/transactions/:id - Get single transaction
router.get('/:id', transaction_controller_1.getTransactionById);
// POST /api/transactions - Create new transaction
router.post('/', transaction_controller_1.createTransaction);
// PUT /api/transactions/:id - Update transaction
router.put('/:id', transaction_controller_1.updateTransaction);
// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', transaction_controller_1.deleteTransaction);
// GET /api/transactions/next-serial/:customerId/:projectId - Get next serial number
router.get('/next-serial/:customerId/:projectId', transaction_controller_1.getNextSerialNumber);
exports.default = router;
