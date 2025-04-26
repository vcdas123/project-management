import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateDto } from '../middleware/validateDto';
import { authenticate } from '../middleware/auth';
import { 
  RegisterDto, 
  LoginDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  UpdatePasswordDto 
} from '../dtos/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateDto(RegisterDto), authController.register);
router.post('/login', validateDto(LoginDto), authController.login);
router.post('/forgot-password', validateDto(ForgotPasswordDto), authController.forgotPassword);
router.post('/reset-password', validateDto(ResetPasswordDto), authController.resetPassword);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.post('/update-password', authenticate, validateDto(UpdatePasswordDto), authController.updatePassword);

export default router;