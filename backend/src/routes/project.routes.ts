import express from 'express';
import {
  getCustomerProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/project.controller';

const router = express.Router();

// GET /api/projects/customer/:customerId - Get all projects for a customer
router.get('/customer/:customerId', getCustomerProjects);

// GET /api/projects/:id - Get single project
router.get('/:id', getProjectById);

// POST /api/projects - Create new project
router.post('/', createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

export default router;