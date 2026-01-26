"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectById = exports.getCustomerProjects = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const Customer_1 = __importDefault(require("../models/Customer"));
const errorResponse_1 = require("../utils/errorResponse");
// Get all projects for a customer
const getCustomerProjects = async (req, res) => {
    try {
        const projects = await Project_1.default.findAll({
            where: { customerId: req.params.customerId },
            order: [['createdAt', 'DESC']],
            attributes: { exclude: ['__v'] }
        });
        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getCustomerProjects = getCustomerProjects;
// Get single project by ID
const getProjectById = async (req, res) => {
    try {
        const project = await Project_1.default.findByPk(req.params.id, {
            attributes: { exclude: ['__v'] }
        });
        if (!project) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Project not found', 404));
            return;
        }
        res.status(200).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.getProjectById = getProjectById;
// Create new project
const createProject = async (req, res) => {
    try {
        // Check if customer exists
        const customer = await Customer_1.default.findByPk(req.body.customerId);
        if (!customer) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Customer not found', 404));
            return;
        }
        const project = await Project_1.default.create(req.body);
        // Note: In Sequelize, associations are handled automatically
        // No need to manually push to array
        res.status(201).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.createProject = createProject;
// Update project
const updateProject = async (req, res) => {
    try {
        const project = await Project_1.default.findByPk(req.params.id);
        if (!project) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Project not found', 404));
            return;
        }
        await project.update(req.body);
        await project.reload();
        res.status(200).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.updateProject = updateProject;
// Delete project
const deleteProject = async (req, res) => {
    try {
        const project = await Project_1.default.findByPk(req.params.id);
        if (!project) {
            res.status(404).json((0, errorResponse_1.createErrorResponse)('Project not found', 404));
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
    }
    catch (error) {
        (0, errorResponse_1.handleControllerError)(error, res);
    }
};
exports.deleteProject = deleteProject;
