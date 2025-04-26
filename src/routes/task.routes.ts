import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { validateDto } from '../middleware/validateDto';
import { authenticate } from '../middleware/auth';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto } from '../dtos/task';
import { handleMultipleUploads } from '../utils/fileUpload';

const router = Router();
const taskController = new TaskController();

// All routes require authentication
router.use(authenticate);

// Task routes
router.post('/', 
  handleMultipleUploads('images', 5), 
  validateDto(CreateTaskDto), 
  taskController.create
);

router.get('/', taskController.findAll);
router.get('/:id', taskController.findById);
router.get('/:id/history', taskController.getTaskHistory);

router.put('/:id', 
  handleMultipleUploads('images', 5), 
  validateDto(UpdateTaskDto), 
  taskController.update
);

router.patch('/:id/status', validateDto(UpdateTaskStatusDto), taskController.updateStatus);
router.delete('/:id', taskController.delete);

export default router;