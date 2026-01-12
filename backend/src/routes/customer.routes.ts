import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  getCustomerFinancialSummary
} from '../controllers/customer.controller';

const router = express.Router();

// GET /api/customers - Get all customers
router.get('/', getAllCustomers);

// GET /api/customers/:id - Get single customer
router.get('/:id', getCustomerById);

// POST /api/customers - Create new customer
router.post('/', createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', deleteCustomer);

// PATCH /api/customers/:id/toggle-status - Toggle customer active status
router.patch('/:id/toggle-status', toggleCustomerStatus);

// GET /api/customers/:id/financial-summary - Get customer financial summary
router.get('/:id/financial-summary', getCustomerFinancialSummary);

export default router;