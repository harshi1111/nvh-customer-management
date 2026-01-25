import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Customer from '../models/Customer';
import Project from '../models/Project';
import Transaction from '../models/Transaction';
import { createErrorResponse, handleControllerError } from '../utils/errorResponse';

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
    handleControllerError(error, res);
  }
};

// Get single customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id)
      .select('-__v')
      .populate('projects', 'name status');
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
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
    handleControllerError(error, res);
  }
};

// Create new customer - EFFICIENT DUPLICATE CHECK
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
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
      const existingByContact = await Customer.findOne({ 
        contactNumber: req.body.contactNumber 
      });
      
      if (existingByContact) {
        console.log('Duplicate found by contact number:', existingByContact.fullName);
        res.status(400).json(createErrorResponse(
          `Customer with contact number ${req.body.contactNumber} already exists: ${existingByContact.fullName}`,
          400
        ));
        return;
      }
      
      // 2. Check by Aadhaar hash (if valid Aadhaar)
      if (/^\d{12}$/.test(cleanAadhaar)) {
        const aadhaarHash = crypto.createHash('sha256').update(cleanAadhaar).digest('hex');
        const existingByHash = await Customer.findOne({ aadhaarHash });
        
        if (existingByHash) {
          console.log('Duplicate found by Aadhaar hash:', existingByHash.fullName);
          res.status(400).json(createErrorResponse(
            `Customer with this Aadhaar already exists: ${existingByHash.fullName}`,
            400
          ));
          return;
        }
      }
      
      // 3. Check by similar name (fuzzy match - optional but helpful)
      const existingByName = await Customer.findOne({
        fullName: { $regex: `^${req.body.fullName.substring(0, 3)}`, $options: 'i' }
      });
      
      if (existingByName) {
        console.log('Possible duplicate by name:', existingByName.fullName);
        // Warn but don't block - names can be similar
        console.warn(`Warning: Similar name found: ${existingByName.fullName}`);
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
    handleControllerError(error, res);
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
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    handleControllerError(error, res);
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
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
    handleControllerError(error, res);
  }
};

// Toggle customer active status
export const toggleCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    customer.isActive = !customer.isActive;
    await customer.save();
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    handleControllerError(error, res);
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
    handleControllerError(error, res);
  }
};