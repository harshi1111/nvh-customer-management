import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project';
import Customer from '../models/Customer';

// Get all projects for a customer
export const getCustomerProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find({ customerId: req.params.customerId })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get customer projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get single project by ID
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id)
      .select('-__v');
    
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Create new project
export const createProject = async (req: Request, res: Response): Promise<void> => {
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
    
    const project = await Project.create(req.body);
    
    // Add project to customer's projects array
    customer.projects.push(project._id as mongoose.Types.ObjectId);
    await customer.save();
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    
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

// Update project
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-__v');
    
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    
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

// Delete project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      res.status(404).json({
        success: false,
        error: 'Project not found'
      });
      return;
    }
    
    // Remove project from customer's projects array
    // Cast customerId to string explicitly
    const customerId = project.customerId as unknown as mongoose.Types.ObjectId;
    await Customer.findByIdAndUpdate(
      customerId.toString(),
      { $pull: { projects: project._id } }
    );
    
    // Delete project
    await project.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};