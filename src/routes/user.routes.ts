import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validateDto } from '../middleware/validateDto';
import { authenticate, authorize } from '../middleware/auth';
import { UpdateUserDto } from '../dtos/user';
import { UserRole } from '../entities/User';
import { handleMultipleUploads } from '../utils/fileUpload';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize(UserRole.ADMIN), userController.findAll);
router.patch('/:id/role', authorize(UserRole.ADMIN), userController.updateRole);
router.patch('/:id/status', authorize(UserRole.ADMIN), userController.toggleActiveStatus);
router.delete('/:id', authorize(UserRole.ADMIN), userController.delete);

// Routes for all authenticated users
router.get('/:id', userController.findById);
router.put('/:id', 
  handleMultipleUploads('profileImage', 1), 
  validateDto(UpdateUserDto), 
  userController.update
);

export default router;