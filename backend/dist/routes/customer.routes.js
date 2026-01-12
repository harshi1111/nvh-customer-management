"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customer_controller_1 = require("../controllers/customer.controller");
const router = express_1.default.Router();
// GET /api/customers - Get all customers
router.get('/', customer_controller_1.getAllCustomers);
// GET /api/customers/:id - Get single customer
router.get('/:id', customer_controller_1.getCustomerById);
// POST /api/customers - Create new customer
router.post('/', customer_controller_1.createCustomer);
// PUT /api/customers/:id - Update customer
router.put('/:id', customer_controller_1.updateCustomer);
// DELETE /api/customers/:id - Delete customer
router.delete('/:id', customer_controller_1.deleteCustomer);
// PATCH /api/customers/:id/toggle-status - Toggle customer active status
router.patch('/:id/toggle-status', customer_controller_1.toggleCustomerStatus);
// GET /api/customers/:id/financial-summary - Get customer financial summary
router.get('/:id/financial-summary', customer_controller_1.getCustomerFinancialSummary);
exports.default = router;
