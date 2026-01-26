import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Transaction from '../models/Transaction';
import Customer from '../models/Customer';
import Project from '../models/Project';
import { createErrorResponse, handleControllerError } from '../utils/errorResponse';

// Get all transactions for a customer (optionally filtered by project)
export const getCustomerTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.query;
    
    let where: any = { customerId: req.params.customerId };
    
    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }
    
    const transactions = await Transaction.findAll({
      where,
      order: [['serialNumber', 'ASC']],
      include: [{
        model: Project,
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ['__v'] }
    });
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get single transaction by ID
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findByPk(req.params.id as string, {
      include: [{
        model: Project,
        attributes: ['id', 'name']
      }],
      attributes: { exclude: ['__v'] }
    });
    
    if (!transaction) {
      res.status(404).json(createErrorResponse('Transaction not found', 404));
      return;
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Create new transaction
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if customer exists
    const customer = await Customer.findByPk(req.body.customerId as string);
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    // Check if project exists
    const project = await Project.findByPk(req.body.projectId as string);
    if (!project) {
      res.status(404).json(createErrorResponse('Project not found', 404));
      return;
    }
    
    // Get next serial number
    const lastTransaction = await Transaction.findOne({
      where: {
        customerId: req.body.customerId,
        projectId: req.body.projectId
      },
      order: [['serialNumber', 'DESC']]
    });
    
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
    handleControllerError(error, res);
  }
};

// Update transaction
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findByPk(req.params.id as string);
    
    if (!transaction) {
      res.status(404).json(createErrorResponse('Transaction not found', 404));
      return;
    }
    
    await transaction.update(req.body);
    await transaction.reload();
    
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (error: any) {
    handleControllerError(error, res);
  }
};

// Delete transaction
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const transaction = await Transaction.findByPk(req.params.id as string);
    
    if (!transaction) {
      res.status(404).json(createErrorResponse('Transaction not found', 404));
      return;
    }
    
    const { customerId, projectId } = transaction;
    
    await transaction.destroy();
    
    // Renumber remaining transactions
    const remainingTransactions = await Transaction.findAll({
      where: {
        customerId,
        projectId
      },
      order: [['serialNumber', 'ASC']]
    });
    
    // Update serial numbers
    for (let i = 0; i < remainingTransactions.length; i++) {
      if (remainingTransactions[i].serialNumber !== i + 1) {
        await remainingTransactions[i].update({ serialNumber: i + 1 });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {}
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get next serial number for a customer/project
export const getNextSerialNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, projectId } = req.params;
    
    const lastTransaction = await Transaction.findOne({
      where: { customerId, projectId },
      order: [['serialNumber', 'DESC']]
    });
    
    const nextSerial = lastTransaction ? lastTransaction.serialNumber + 1 : 1;
    
    res.status(200).json({
      success: true,
      data: { nextSerial }
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};