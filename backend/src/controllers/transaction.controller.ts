import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Customer from '../models/Customer';
import Project from '../models/Project';

// Get all transactions for a customer (optionally filtered by project)
export const getCustomerTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    
    let query: any = { customerId: req.params.customerId };
    
    if (projectId && typeof projectId === 'string') {
      query.projectId = projectId;
    }
    
    const transactions = await Transaction.find(query)
      .sort({ serialNumber: 1 })
      .populate('projectId', 'name')
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get customer transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get single transaction by ID
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('projectId', 'name')
      .select('-__v');
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Create new transaction
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if customer exists
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) {
      res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
      return;
    }
    
    // Check if project exists
    const project = await Project.findById(req.body.projectId);
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }
    
    // Get next serial number
    const lastTransaction = await Transaction.findOne(
      { customerId: req.body.customerId, projectId: req.body.projectId },
      {},
      { sort: { serialNumber: -1 } }
    );
    
    const nextSerial = lastTransaction ? lastTransaction.serialNumber + 1 : 1;
    
    const transactionData = {
      ...req.body,
      serialNumber: nextSerial
    };
    
    const transaction = await Transaction.create(transactionData);
    
    res.status(201).json({
      success: true,
      data: transaction
    });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    } else if (error.code === 11000) {
      res.status(400).json({
        success: false,
        error: 'Duplicate serial number for this customer and project'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  }
};

// Update transaction
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v');
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error: any) {
    console.error('Update transaction error:', error);
    
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

// Delete transaction
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
      return;
    }
    
    await transaction.deleteOne();
    
    // Renumber remaining transactions
    const remainingTransactions = await Transaction.find({
      customerId: transaction.customerId,
      projectId: transaction.projectId
    }).sort({ serialNumber: 1 });
    
    // Update serial numbers
    for (let i = 0; i < remainingTransactions.length; i++) {
      if (remainingTransactions[i].serialNumber !== i + 1) {
        remainingTransactions[i].serialNumber = i + 1;
        await remainingTransactions[i].save();
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get next serial number for a customer/project
export const getNextSerialNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, projectId } = req.params;
    
    const lastTransaction = await Transaction.findOne(
      { customerId, projectId },
      {},
      { sort: { serialNumber: -1 } }
    );
    
    const nextSerial = lastTransaction ? lastTransaction.serialNumber + 1 : 1;
    
    res.status(200).json({
      success: true,
      data: { nextSerial }
    });
  } catch (error) {
    console.error('Get next serial number error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};