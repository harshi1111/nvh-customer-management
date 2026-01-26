"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controller_1 = require("../controllers/project.controller");
const router = express_1.default.Router();
// GET /api/projects/customer/:customerId - Get all projects for a customer
router.get('/customer/:customerId', project_controller_1.getCustomerProjects);
// GET /api/projects/:id - Get single project
router.get('/:id', project_controller_1.getProjectById);
// POST /api/projects - Create new project
router.post('/', project_controller_1.createProject);
// PUT /api/projects/:id - Update project
router.put('/:id', project_controller_1.updateProject);
// DELETE /api/projects/:id - Delete project
router.delete('/:id', project_controller_1.deleteProject);
exports.default = router;
