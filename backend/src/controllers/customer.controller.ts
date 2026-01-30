import { Request, Response } from 'express';
import { Op } from 'sequelize';
import crypto from 'crypto';
import sequelize from '../config/postgres';
import Customer from '../models/Customer'; // KEEP import for TYPE only
import Project from '../models/Project'; // KEEP import for TYPE only  
import Transaction from '../models/Transaction'; // KEEP import for TYPE only
import { createErrorResponse, handleControllerError } from '../utils/errorResponse';

// Get the typed models from sequelize
const CustomerModel = sequelize.models.Customer as typeof Customer;
const ProjectModel = sequelize.models.Project as typeof Project;
const TransactionModel = sequelize.models.Transaction as typeof Transaction;

// Get all customers - FIXED WITH TYPING
export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    
    const where: any = {};
    
    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }
    
    if (search && typeof search === 'string') {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { contactNumber: { [Op.iLike]: `%${search}%` } },
        { aadhaarNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const customers = await CustomerModel.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['__v'] }
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

// Get single customer by ID - FIXED WITH TYPING
export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.findByPk(req.params.id as string, {
      attributes: { exclude: ['__v'] },
      include: [{
        model: ProjectModel,
        attributes: ['id', 'name', 'status']
      }]
    });
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    const transactions = await TransactionModel.findAll({
      where: { customerId: customer.id }
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

// Create new customer - FIXED WITH TYPING
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE CUSTOMER START ===');
    console.log('Received data:', {
      aadhaar: req.body.aadhaarNumber,
      name: req.body.fullName,
      contact: req.body.contactNumber
    });

    if (req.body.aadhaarNumber) {
      const cleanAadhaar = req.body.aadhaarNumber.replace(/\s/g, '');
      
      const existingByContact = await CustomerModel.findOne({ 
        where: { contactNumber: req.body.contactNumber }
      });
      
      if (existingByContact) {
        console.log('Duplicate found by contact number:', existingByContact.fullName);
        res.status(400).json(createErrorResponse(
          `Customer with contact number ${req.body.contactNumber} already exists: ${existingByContact.fullName}`,
          400
        ));
        return;
      }
      
      if (/^\d{12}$/.test(cleanAadhaar)) {
        const aadhaarHash = crypto.createHash('sha256').update(cleanAadhaar).digest('hex');
        const existingByHash = await CustomerModel.findOne({ 
          where: { aadhaarHash }
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
      
      const existingByName = await CustomerModel.findOne({
        where: {
          fullName: { [Op.iLike]: `%${req.body.fullName.substring(0, 3)}%` }
        }
      });
      
      if (existingByName) {
        console.log('Possible duplicate by name:', existingByName.fullName);
        console.warn(`Warning: Similar name found: ${existingByName.fullName}`);
      }
    }

    console.log('No duplicates found, creating customer...');
    
    const customer = await CustomerModel.create({
      ...req.body
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

// Update customer - FIXED WITH TYPING
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.findByPk(req.params.id as string);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    await customer.update(req.body);
    await customer.reload();
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    handleControllerError(error, res);
  }
};

// Delete customer - FIXED WITH TYPING
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.findByPk(req.params.id as string);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    await ProjectModel.destroy({ 
      where: { customerId: customer.id }
    });
    
    await TransactionModel.destroy({ 
      where: { customerId: customer.id }
    });
    
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

// Toggle customer active status - FIXED WITH TYPING
export const toggleCustomerStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const customer = await CustomerModel.findByPk(req.params.id as string);
    
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

// Get customer financial summary - FIXED WITH TYPING
export const getCustomerFinancialSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    
    let where: any = { customerId: req.params.id };
    
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }
    
    const transactions = await TransactionModel.findAll({
      where
    });
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    transactions.forEach((transaction: Transaction) => {
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

// Check duplicate Aadhaar - FIXED WITH TYPING
export const checkDuplicateAadhaar = async (req: Request, res: Response): Promise<void> => {
  try {
    const { aadhaar } = req.params;
    const { exclude } = req.query;
    
    const aadhaarString = Array.isArray(aadhaar) ? aadhaar[0] : aadhaar;
    
    if (!aadhaarString || aadhaarString.length !== 12) {
      res.status(400).json(createErrorResponse('Invalid Aadhaar number', 400));
      return;
    }
    
    const cleanAadhaar = aadhaarString.replace(/\s/g, '');
    const aadhaarHash = crypto.createHash('sha256').update(cleanAadhaar).digest('hex');
    
    const where: any = { aadhaarHash };
    
    if (exclude && typeof exclude === 'string') {
      where.id = { [Op.ne]: exclude };
    }
    
    const existingCustomer = await CustomerModel.findOne({
      where,
      attributes: ['id', 'fullName', 'contactNumber']
    });
    
    if (existingCustomer) {
      res.status(200).json({
        exists: true,
        customerName: existingCustomer.fullName,
        contactNumber: existingCustomer.contactNumber
      });
      return;
    }
    
    res.status(200).json({
      exists: false
    });
    
  } catch (error) {
    handleControllerError(error, res);
  }
};