import { Request, Response } from 'express';
import Project from '../models/Project';
import Customer from '../models/Customer';
import { createErrorResponse, handleControllerError } from '../utils/errorResponse';

// Get all projects for a customer
export const getCustomerProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.findAll({
      where: { customerId: req.params.customerId },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['__v'] }
    });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Get single project by ID
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByPk(req.params.id as string, {
      attributes: { exclude: ['__v'] }
    });
    
    if (!project) {
      res.status(404).json(createErrorResponse('Project not found', 404));
      return;
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};

// Create new project
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if customer exists
    const customer = await Customer.findByPk(req.body.customerId as string);
    
    if (!customer) {
      res.status(404).json(createErrorResponse('Customer not found', 404));
      return;
    }
    
    const project = await Project.create(req.body);
    
    // Note: In Sequelize, associations are handled automatically
    // No need to manually push to array
    
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    handleControllerError(error, res);
  }
};

// Update project
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByPk(req.params.id as string);
    
    if (!project) {
      res.status(404).json(createErrorResponse('Project not found', 404));
      return;
    }
    
    await project.update(req.body);
    await project.reload();
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error: any) {
    handleControllerError(error, res);
  }
};

// Delete project
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const project = await Project.findByPk(req.params.id as string);
    
    if (!project) {
      res.status(404).json(createErrorResponse('Project not found', 404));
      return;
    }
    
    // In Sequelize, cascading delete is handled by associations
    // If you set onDelete: 'CASCADE' in the model associations
    
    // Delete project (related transactions will be deleted if cascade is set)
    await project.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: {}
    });
  } catch (error) {
    handleControllerError(error, res);
  }
};