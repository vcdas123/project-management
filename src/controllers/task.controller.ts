import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { UpdateTaskStatusDto } from '../dtos/task/update-task-status.dto';
import { TaskQueryDto } from '../dtos/task/task-query.dto';
import { AppError } from '../utils/appError';
import { getUploadedFilePaths } from '../utils/fileUpload';
import { plainToClass } from 'class-transformer';

export class TaskController {
  private taskService = new TaskService();

  create = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const createTaskDto: CreateTaskDto = req.body;
    
    // Add uploaded images if any
    const uploadedFiles = getUploadedFilePaths(req);
    if (uploadedFiles.length > 0) {
      createTaskDto.images = uploadedFiles;
    }

    const task = await this.taskService.create(createTaskDto, req.user.id, req.user.role);
    
    return res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: {
        task
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

    const queryDto = plainToClass(TaskQueryDto, req.query);
    const result = await this.taskService.findAll(queryDto, req.user.id, req.user.role);
    
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
    const task = await this.taskService.findById(id, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      data: {
        task
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
    const updateTaskDto: UpdateTaskDto = req.body;
    
    // Add uploaded images if any
    const uploadedFiles = getUploadedFilePaths(req);
    if (uploadedFiles.length > 0) {
      updateTaskDto.images = uploadedFiles;
    }

    const task = await this.taskService.update(id, updateTaskDto, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: {
        task
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
    const { status } = req.body as UpdateTaskStatusDto;

    const task = await this.taskService.updateStatus(id, status, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      message: 'Task status updated successfully',
      data: {
        task
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

    const { id } = req.params;
    await this.taskService.delete(id, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  };

  getTaskHistory = async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const { id } = req.params;
    const history = await this.taskService.getTaskHistory(id, req.user.id, req.user.role);
    
    return res.status(200).json({
      status: 'success',
      data: {
        history
      }
    });
  };
}