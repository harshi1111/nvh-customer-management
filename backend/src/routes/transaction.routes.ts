import express from 'express';
import {
  getCustomerTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getNextSerialNumber
} from '../controllers/transaction.controller';

const router = express.Router();

// GET /api/transactions/customer/:customerId - Get all transactions for a customer
router.get('/customer/:customerId', getCustomerTransactions);

// GET /api/transactions/:id - Get single transaction
router.get('/:id', getTransactionById);

// POST /api/transactions - Create new transaction
router.post('/', createTransaction);

// PUT /api/transactions/:id - Update transaction
router.put('/:id', updateTransaction);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', deleteTransaction);

// GET /api/transactions/next-serial/:customerId/:projectId - Get next serial number
router.get('/next-serial/:customerId/:projectId', getNextSerialNumber);

export default router;