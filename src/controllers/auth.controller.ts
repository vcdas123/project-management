import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { ForgotPasswordDto } from '../dtos/auth/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/auth/reset-password.dto';
import { UpdatePasswordDto } from '../dtos/auth/update-password.dto';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<Response> => {
    const registerDto: RegisterDto = req.body;
    const result = await this.authService.register(registerDto);
    
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    const loginDto: LoginDto = req.body;
    const result = await this.authService.login(loginDto);
    
    return res.status(200).json({
      status: 'success',
      message: 'User logged in successfully',
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  };

  forgotPassword = async (req: Request, res: Response): Promise<Response> => {
    const forgotPasswordDto: ForgotPasswordDto = req.body;
    await this.authService.forgotPassword(forgotPasswordDto);
    
    // Always return success to prevent user enumeration
    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  };

  resetPassword = async (req: Request, res: Response): Promise<Response> => {
    const resetPasswordDto: ResetPasswordDto = req.body;
    await this.authService.resetPassword(resetPasswordDto);
    
    return res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  };

  updatePassword = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const updatePasswordDto: UpdatePasswordDto = req.body;
    await this.authService.updatePassword(req.user.id, updatePasswordDto);
    
    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  };

  getProfile = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  };
}