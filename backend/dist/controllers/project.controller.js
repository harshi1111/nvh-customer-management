"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getCustomerProjects = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const Customer_1 = __importDefault(require("../models/Customer"));
// Get all projects for a customer
const getCustomerProjects = async (req, res) => {
    try {
        const projects = await Project_1.default.find({ customerId: req.params.customerId })
            .sort({ createdAt: -1 })
            .select('-__v');
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    }
    catch (error) {
        console.error('Get customer projects error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getCustomerProjects = getCustomerProjects;
// Get single project by ID
const getProjectById = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id)
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
    }
    catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.getProjectById = getProjectById;
// Create new project
const createProject = async (req, res) => {
    try {
        // Check if customer exists
        const customer = await Customer_1.default.findById(req.body.customerId);
        if (!customer) {
            res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
            return;
        }
        const project = await Project_1.default.create(req.body);
        // Add project to customer's projects array
        customer.projects.push(project._id);
        await customer.save();
        res.status(201).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        console.error('Create project error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Server error'
            });
        }
    }
};
exports.createProject = createProject;
// Update project
const updateProject = async (req, res) => {
    try {
        const project = await Project_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).select('-__v');
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
    }
    catch (error) {
        console.error('Update project error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err) => err.message);
            res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Server error'
            });
        }
    }
};
exports.updateProject = updateProject;
// Delete project
const deleteProject = async (req, res) => {
    try {
        const project = await Project_1.default.findById(req.params.id);
        if (!project) {
            res.status(404).json({
                success: false,
                error: 'Project not found'
            });
            return;
        }
        // Remove project from customer's projects array
        // Cast customerId to string explicitly
        const customerId = project.customerId;
        await Customer_1.default.findByIdAndUpdate(customerId.toString(), { $pull: { projects: project._id } });
        // Delete project
        await project.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: {}
        });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
exports.deleteProject = deleteProject;
