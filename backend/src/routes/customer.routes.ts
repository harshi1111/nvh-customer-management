import express from 'express';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  getCustomerFinancialSummary,
  checkDuplicateAadhaar // ADD THIS
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

// GET /api/customers/check-aadhaar/:aadhaar - Check for duplicate Aadhaar
router.get('/check-aadhaar/:aadhaar', checkDuplicateAadhaar);

export default router;