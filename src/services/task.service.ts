import { AppDataSource } from '../database/connection';
import { Task, TaskStatus } from '../entities/Task';
import { User, UserRole } from '../entities/User';
import { Project } from '../entities/Project';
import { TaskMember } from '../entities/TaskMember';
import { TaskHistory } from '../entities/TaskHistory';
import { AppError } from '../utils/appError';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { TaskQueryDto } from '../dtos/task/task-query.dto';
import { createPagination, PaginatedResult } from '../utils/pagination';
import { ActionType } from '../entities/ProjectHistory';
import { In } from 'typeorm';

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private userRepository = AppDataSource.getRepository(User);
  private projectRepository = AppDataSource.getRepository(Project);
  private taskMemberRepository = AppDataSource.getRepository(TaskMember);
  private taskHistoryRepository = AppDataSource.getRepository(TaskHistory);

  async create(createTaskDto: CreateTaskDto, userId: string, userRole: UserRole): Promise<Task> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get project
      const project = await this.projectRepository.findOne({
        where: { id: createTaskDto.projectId },
        relations: ['owner', 'members']
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Check if user is admin or project owner
      const isAdmin = userRole === UserRole.ADMIN;
      const isProjectOwner = project.ownerId === userId;

      if (!isAdmin && !isProjectOwner) {
        throw new AppError('Only project owners or admins can create tasks', 403);
      }

      // Validate deadline against project deadline
      const taskDeadline = new Date(createTaskDto.deadline);
      if (taskDeadline > project.deadline) {
        throw new AppError('Task deadline cannot exceed project deadline', 400);
      }

      // Create task
      const task = new Task();
      task.name = createTaskDto.name;
      task.description = createTaskDto.description;
      task.deadline = taskDeadline;
      task.images = createTaskDto.images || [];
      task.project = project;
      task.projectId = project.id;
      task.assignedBy = user;
      task.assignedById = user.id;

      const savedTask = await queryRunner.manager.save(task);

      // Add task members if any
      if (createTaskDto.memberIds && createTaskDto.memberIds.length > 0) {
        // Verify that members are part of the project
        const projectMemberIds = project.members.map(member => member.userId);
        const validMemberIds = createTaskDto.memberIds.filter(id => 
          projectMemberIds.includes(id) || id === project.ownerId
        );

        if (validMemberIds.length !== createTaskDto.memberIds.length) {
          throw new AppError('Some members are not part of the project', 400);
        }

        const members = await this.userRepository.findBy({ id: In(validMemberIds) });
        
        for (const member of members) {
          const taskMember = new TaskMember();
          taskMember.task = savedTask;
          taskMember.taskId = savedTask.id;
          taskMember.user = member;
          taskMember.userId = member.id;

          await queryRunner.manager.save(taskMember);
        }
      }

      // Track history
      const history = new TaskHistory();
      history.task = savedTask;
      history.taskId = savedTask.id;
      history.user = user;
      history.userId = user.id;
      history.action = ActionType.CREATE;
      history.changes = {
        name: savedTask.name,
        description: savedTask.description,
        deadline: savedTask.deadline,
        status: savedTask.status,
        images: savedTask.images
      };

      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      return savedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: TaskQueryDto, userId: string, userRole: UserRole): Promise<PaginatedResult<Task>> {
    const { 
      search, 
      status, 
      projectId, 
      assignedById, 
      startDate, 
      endDate, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC',
      page = 1, 
      limit = 10 
    } = query;

    const queryBuilder = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignedBy', 'assignedBy')
      .leftJoinAndSelect('task.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .leftJoinAndSelect('project.owner', 'projectOwner')
      .leftJoinAndSelect('project.members', 'projectMembers');

    // Filter by user access (admin can see all, users only see tasks where they are members or project owners)
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.where('project.ownerId = :userId', { userId })
        .orWhere('members.userId = :userId', { userId })
        .orWhere('projectMembers.userId = :userId', { userId });
    }

    // Apply filters
    if (search) {
      queryBuilder.andWhere('(task.name LIKE :search OR task.description LIKE :search)', 
        { search: `%${search}%` });
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (projectId) {
      queryBuilder.andWhere('task.projectId = :projectId', { projectId });
    }

    if (assignedById) {
      queryBuilder.andWhere('task.assignedById = :assignedById', { assignedById });
    }

    if (startDate) {
      queryBuilder.andWhere('task.deadline >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('task.deadline <= :endDate', { endDate });
    }

    // Apply sorting
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results
    const [tasks, total] = await queryBuilder.getManyAndCount();

    return createPagination(tasks, total, { page, limit });
  }

  async findById(id: string, userId: string, userRole: UserRole): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: [
        'project', 
        'assignedBy', 
        'members', 
        'members.user', 
        'project.owner', 
        'project.members'
      ]
    });

    if (!task) {
      throw new AppError('Task not found', 404);
    }

    // Check user access
    const isAdmin = userRole === UserRole.ADMIN;
    const isProjectOwner = task.project.ownerId === userId;
    const isTaskMember = task.members.some(member => member.userId === userId);
    const isProjectMember = task.project.members.some(member => member.userId === userId);

    if (!isAdmin && !isProjectOwner && !isTaskMember && !isProjectMember) {
      throw new AppError('You do not have permission to access this task', 403);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: UserRole): Promise<Task> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get task with relations
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: ['project', 'project.owner', 'members']
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      // Check permissions (only admin or project owner can update)
      const isAdmin = userRole === UserRole.ADMIN;
      const isProjectOwner = task.project.ownerId === userId;

      if (!isAdmin && !isProjectOwner) {
        throw new AppError('Only project owners or admins can update tasks', 403);
      }

      // Store original values for history
      const originalValues = {
        name: task.name,
        description: task.description,
        deadline: task.deadline,
        status: task.status,
        images: task.images
      };

      // Update task
      if (updateTaskDto.name) task.name = updateTaskDto.name;
      if (updateTaskDto.description) task.description = updateTaskDto.description;
      
      if (updateTaskDto.deadline) {
        const newDeadline = new Date(updateTaskDto.deadline);
        // Validate against project deadline
        if (newDeadline > task.project.deadline) {
          throw new AppError('Task deadline cannot exceed project deadline', 400);
        }
        task.deadline = newDeadline;
      }
      
      if (updateTaskDto.status) task.status = updateTaskDto.status;
      if (updateTaskDto.images) task.images = updateTaskDto.images;

      // Save task
      const updatedTask = await queryRunner.manager.save(task);

      // Handle members update if provided
      if (updateTaskDto.memberIds) {
        // Remove existing members
        await queryRunner.manager.delete(TaskMember, { taskId: task.id });

        // Verify members are part of the project
        const project = await this.projectRepository.findOne({
          where: { id: task.projectId },
          relations: ['members']
        });

        if (!project) {
          throw new AppError('Project not found', 404);
        }

        const projectMemberIds = project.members.map(member => member.userId);
        const validMemberIds = updateTaskDto.memberIds.filter(id => 
          projectMemberIds.includes(id) || id === project.ownerId
        );

        if (validMemberIds.length !== updateTaskDto.memberIds.length) {
          throw new AppError('Some members are not part of the project', 400);
        }

        // Add new members
        const members = await this.userRepository.findBy({ id: In(validMemberIds) });
        
        for (const member of members) {
          const taskMember = new TaskMember();
          taskMember.task = updatedTask;
          taskMember.taskId = updatedTask.id;
          taskMember.user = member;
          taskMember.userId = member.id;

          await queryRunner.manager.save(taskMember);
        }
      }

      // Track history
      const user = await this.userRepository.findOneBy({ id: userId });
      
      const history = new TaskHistory();
      history.task = updatedTask;
      history.taskId = updatedTask.id;
      history.user = user!;
      history.userId = userId;
      history.action = ActionType.UPDATE;
      history.changes = {
        before: originalValues,
        after: {
          name: updatedTask.name,
          description: updatedTask.description,
          deadline: updatedTask.deadline,
          status: updatedTask.status,
          images: updatedTask.images
        }
      };

      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: TaskStatus, userId: string, userRole: UserRole): Promise<Task> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: ['project', 'project.owner', 'members']
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      // Check permissions (admin, project owner, or task member can update status)
      const isAdmin = userRole === UserRole.ADMIN;
      const isProjectOwner = task.project.ownerId === userId;
      const isTaskMember = task.members.some(member => member.userId === userId);

      if (!isAdmin && !isProjectOwner && !isTaskMember) {
        throw new AppError('You do not have permission to update this task status', 403);
      }

      const originalStatus = task.status;
      task.status = status;

      const updatedTask = await queryRunner.manager.save(task);

      // Track history
      const user = await this.userRepository.findOneBy({ id: userId });
      
      const history = new TaskHistory();
      history.task = updatedTask;
      history.taskId = updatedTask.id;
      history.user = user!;
      history.userId = userId;
      history.action = ActionType.UPDATE;
      history.changes = {
        field: 'status',
        before: originalStatus,
        after: status
      };

      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      return updatedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async delete(id: string, userId: string, userRole: UserRole): Promise<boolean> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: ['project', 'project.owner']
      });

      if (!task) {
        throw new AppError('Task not found', 404);
      }

      // Check permissions (only admin or project owner can delete)
      const isAdmin = userRole === UserRole.ADMIN;
      const isProjectOwner = task.project.ownerId === userId;

      if (!isAdmin && !isProjectOwner) {
        throw new AppError('Only project owners or admins can delete tasks', 403);
      }

      // Track history before deletion
      const user = await this.userRepository.findOneBy({ id: userId });
      
      const history = new TaskHistory();
      history.taskId = task.id;
      history.user = user!;
      history.userId = userId;
      history.action = ActionType.DELETE;
      history.changes = {
        name: task.name,
        description: task.description,
        status: task.status,
        deadline: task.deadline
      };

      await queryRunner.manager.save(history);

      // Delete task members
      await queryRunner.manager.delete(TaskMember, { taskId: id });

      // Delete task
      await queryRunner.manager.delete(Task, id);

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTaskHistory(id: string, userId: string, userRole: UserRole): Promise<TaskHistory[]> {
    // Check task exists and user has access
    const task = await this.findById(id, userId, userRole);

    // Get history
    const history = await this.taskHistoryRepository.find({
      where: { taskId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    return history;
  }
}