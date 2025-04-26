import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { UserRole } from '../entities/User';
import { AppError } from '../utils/appError';
import { getUploadedFilePaths } from '../utils/fileUpload';

export class UserController {
  private userService = new UserService();

  findAll = async (req: Request, res: Response): Promise<Response> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    const result = await this.userService.findAll(page, limit);
    
    return res.status(200).json({
      status: 'success',
      data: result
    });
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const user = await this.userService.findById(id);
    
    return res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const updateUserDto: UpdateUserDto = req.body;
    
    // If profile image was uploaded, add the path
    const uploadedFiles = getUploadedFilePaths(req);
    if (uploadedFiles.length > 0) {
      updateUserDto.profileImage = uploadedFiles[0];
    }

    // Users can only update their own profile unless they are admin
    const targetId = req.params.id;
    if (req.user.id !== targetId && req.user.role !== UserRole.ADMIN) {
      throw new AppError('You can only update your own profile', 403);
    }

    const user = await this.userService.update(targetId, updateUserDto);
    
    return res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user
      }
    });
  };

  updateRole = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new AppError('Only admin can update user roles', 403);
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const user = await this.userService.updateRole(id, role, req.user.id);
    
    return res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: {
        user
      }
    });
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new AppError('Only admin can delete users', 403);
    }

    const { id } = req.params;
    await this.userService.delete(id);
    
    return res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  };

  toggleActiveStatus = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (req.user.role !== UserRole.ADMIN) {
      throw new AppError('Only admin can activate/deactivate users', 403);
    }

    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean', 400);
    }

    const user = await this.userService.toggleActiveStatus(id, isActive);
    
    return res.status(200).json({
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user
      }
    });
  };
}