import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Project from '../models/Project';
import Transaction from '../models/Transaction';
import { AadhaarEncryption } from '../utils/encryption';


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

// Create new customer - FIXED DUPLICATE CHECK
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE CUSTOMER START ===');
    console.log('Received data:', {
      aadhaar: req.body.aadhaarNumber,
      name: req.body.fullName,
      contact: req.body.contactNumber
    });

    // Check if Aadhaar already exists - SIMPLE FIX
    if (req.body.aadhaarNumber) {
      const cleanAadhaar = req.body.aadhaarNumber.replace(/\s/g, '');
      
      // Try to find by contact number first (more reliable)
      const existingByContact = await Customer.findOne({ 
        contactNumber: req.body.contactNumber 
      });
      
      if (existingByContact) {
        console.log('Duplicate found by contact number:', existingByContact.fullName);
        res.status(400).json({
          success: false,
          error: `Customer with contact number ${req.body.contactNumber} already exists: ${existingByContact.fullName}`
        });
        return;
      }
      
      // Try to find by name and partial Aadhaar match
      // Search for customers with similar Aadhaar patterns
      const allCustomers = await Customer.find({}).select('aadhaarNumber fullName contactNumber');
      
      for (const customer of allCustomers) {
        const storedAadhaar = customer.get('aadhaarNumber', null, { getters: false });
        
        // Check if stored Aadhaar contains any part of the new Aadhaar
        if (storedAadhaar && storedAadhaar.includes(cleanAadhaar.substring(0, 4))) {
          console.log('Possible duplicate found:', customer.fullName);
          res.status(400).json({
            success: false,
            error: `Possible duplicate found: ${customer.fullName} (Aadhaar: ${customer.aadhaarNumber})`
          });
          return;
        }
      }
    }
    
    console.log('No duplicates found, creating customer...');
    
    // Create the customer
    const customer = await Customer.create({
      ...req.body,
      projects: []
    });
    
    console.log('Customer created successfully:', customer.fullName);
    
    res.status(201).json({
      success: true,
      data: customer
    });
    
  } catch (error: any) {
    console.error('Create customer error:', error);
    
    // MongoDB duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Aadhaar number already exists in the database'
      });
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server error: ' + error.message
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