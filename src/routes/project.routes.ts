import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { validateDto } from '../middleware/validateDto';
import { authenticate } from '../middleware/auth';
import { CreateProjectDto, UpdateProjectDto } from '../dtos/project';
import { handleMultipleUploads } from '../utils/fileUpload';

const router = Router();
const projectController = new ProjectController();

// All routes require authentication
router.use(authenticate);

// Project routes
router.post('/', 
  handleMultipleUploads('images', 5), 
  validateDto(CreateProjectDto), 
  projectController.create
);

router.get('/', projectController.findAll);
router.get('/:id', projectController.findById);
router.get('/:id/history', projectController.getProjectHistory);

router.put('/:id', 
  handleMultipleUploads('images', 5), 
  validateDto(UpdateProjectDto), 
  projectController.update
);

router.patch('/:id/status', projectController.updateStatus);
router.delete('/:id', projectController.delete);

export default router;