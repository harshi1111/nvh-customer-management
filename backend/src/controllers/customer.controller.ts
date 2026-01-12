import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Project from '../models/Project';
import Transaction from '../models/Transaction';

// Get all customers
export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    
    let query: any = {};
    
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
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get single customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id)
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
    const transactions = await Transaction.find({ customerId: customer._id });
    
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
  } catch (error) {
    console.error('Get customer by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Create new customer
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if Aadhaar already exists
    console.log('Checking Aadhaar:', req.body.aadhaarNumber); // DEBUG
    const existingCustomer = await Customer.findOne({ 
      aadhaarNumber: req.body.aadhaarNumber 
    });
    console.log('Found existing customer:', existingCustomer); // DEBUG
    
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
    
    const customer = await Customer.create(customerData);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('Create customer error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v');
    
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
  } catch (error: any) {
    console.error('Update customer error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }
    
    // Delete customer's projects
    await Project.deleteMany({ customerId: customer._id });
    
    // Delete customer's transactions
    await Transaction.deleteMany({ customerId: customer._id });
    
    // Delete customer
    await customer.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Toggle customer active status
export const toggleCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    
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
  } catch (error) {
    console.error('Toggle customer status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get customer financial summary
export const getCustomerFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    
    let query: any = { customerId: req.params.id };
    
    if (projectId && typeof projectId === 'string') {
      query.projectId = projectId;
    }
    
    const transactions = await Transaction.find(query);
    
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
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};