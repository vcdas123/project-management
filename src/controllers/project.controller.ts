import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dtos/project/create-project.dto';
import { UpdateProjectDto } from '../dtos/project/update-project.dto';
import { ProjectQueryDto } from '../dtos/project/project-query.dto';
import { ProjectStatus } from '../entities/Project';
import { UserRole } from '../entities/User';
import { AppError } from '../utils/appError';
import { getUploadedFilePaths } from '../utils/fileUpload';
import { plainToClass } from 'class-transformer';

export class ProjectController {
  private projectService = new ProjectService();

  create = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const createProjectDto: CreateProjectDto = req.body;
    
    // Add uploaded images if any
    const uploadedFiles = getUploadedFilePaths(req);
    if (uploadedFiles.length > 0) {
      createProjectDto.images = uploadedFiles;
    }

    const project = await this.projectService.create(createProjectDto, req.user.id);
    
    return res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      data: {
        project
      }
    });
  };

  findAll = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const queryDto = plainToClass(ProjectQueryDto, req.query);
    const result = await this.projectService.findAll(queryDto, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      data: result
    });
  };

  findById = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const project = await this.projectService.findById(id, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      data: {
        project
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

    const { id } = req.params;
    const updateProjectDto: UpdateProjectDto = req.body;
    
    // Add uploaded images if any
    const uploadedFiles = getUploadedFilePaths(req);
    if (uploadedFiles.length > 0) {
      updateProjectDto.images = uploadedFiles;
    }

    const project = await this.projectService.update(id, updateProjectDto, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      message: 'Project updated successfully',
      data: {
        project
      }
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(ProjectStatus).includes(status)) {
      throw new AppError('Invalid project status', 400);
    }

    const project = await this.projectService.updateStatus(id, status, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      message: 'Project status updated successfully',
      data: {
        project
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

    // Only admin can delete projects
    if (req.user.role !== UserRole.ADMIN) {
      throw new AppError('Only admin can delete projects', 403);
    }

    const { id } = req.params;
    await this.projectService.delete(id, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully'
    });
  };

  getProjectHistory = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const history = await this.projectService.getProjectHistory(id, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      data: {
        history
      }
    });
  };
}