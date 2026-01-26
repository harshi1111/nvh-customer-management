import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import Customer from '../models/Customer';
import Project from '../models/Project';
import Transaction from '../models/Transaction';
import { createErrorResponse, handleControllerError } from '../utils/errorResponse';

// Get all customers - UPDATED FOR SEQUELIZE
export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    
    // Build where clause for Sequelize
    const where: any = {};
    
    // Filter by status
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }
    
    // Search by name, phone, or Aadhaar
    if (search && typeof search === 'string') {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { contactNumber: { [Op.iLike]: `%${search}%` } },
        { aadhaarNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const customers = await Customer.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['__v'] } // Sequelize doesn't have __v
    });
    
    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get single customer by ID - UPDATED FOR SEQUELIZE
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByPk(req.params.id as string, { // ADDED 'as string'
      attributes: { exclude: ['__v'] },
      include: [{
        model: Project,
        attributes: ['id', 'name', 'status']
      }]
    });
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    // Get financial summary
    const transactions = await Transaction.findAll({
      where: { customerId: customer.id } // Use customer.id not customer._id
    });
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    transactions.forEach((transaction: Transaction) => {
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

// Create new customer - EFFICIENT DUPLICATE CHECK - UPDATED FOR SEQUELIZE
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
        where: { contactNumber: req.body.contactNumber } // SEQUELIZE SYNTAX
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
        const existingByHash = await Customer.findOne({ 
          where: { aadhaarHash } // SEQUELIZE SYNTAX
        });
        
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
        where: {
          fullName: { [Op.iLike]: `%${req.body.fullName.substring(0, 3)}%` } // SEQUELIZE SYNTAX
        }
      });
      
      if (existingByName) {
        console.log('Possible duplicate by name:', existingByName.fullName);
        // Warn but don't block - names can be similar
        console.warn(`Warning: Similar name found: ${existingByName.fullName}`);
      }
    }

    console.log('No duplicates found, creating customer...');
    
    // Create the customer - SEQUELIZE SYNTAX
    const customer = await Customer.create({
      ...req.body
      // projects array is handled by associations, not needed here
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

// Update customer - UPDATED FOR SEQUELIZE
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByPk(req.params.id as string);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    // Update customer with new data
    await customer.update(req.body);
    
    // Reload to get updated data with associations if needed
    await customer.reload();
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    handleControllerError(error, res);
  }
};

// Delete customer - UPDATED FOR SEQUELIZE
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByPk(req.params.id as string);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    // Delete customer's projects - SEQUELIZE SYNTAX
    await Project.destroy({ 
      where: { customerId: customer.id } // Use customer.id not customer._id
    });
    
    // Delete customer's transactions - SEQUELIZE SYNTAX
    await Transaction.destroy({ 
      where: { customerId: customer.id } // Use customer.id not customer._id
    });
    
    // Delete customer
    await customer.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: {}
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Toggle customer active status - UPDATED FOR SEQUELIZE
export const toggleCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await Customer.findByPk(req.params.id as string);
    
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

// Get customer financial summary - UPDATED FOR SEQUELIZE
export const getCustomerFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    
    let where: any = { customerId: req.params.id };
    
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }
    
    const transactions = await Transaction.findAll({
      where
    });
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    transactions.forEach((transaction: any) => {
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