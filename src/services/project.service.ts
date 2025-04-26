import { AppDataSource } from '../database/connection';
import { Project, ProjectStatus } from '../entities/Project';
import { User, UserRole } from '../entities/User';
import { ProjectMember } from '../entities/ProjectMember';
import { ProjectHistory } from '../entities/ProjectHistory';
import { AppError } from '../utils/appError';
import { CreateProjectDto } from '../dtos/project/create-project.dto';
import { UpdateProjectDto } from '../dtos/project/update-project.dto';
import { ProjectQueryDto } from '../dtos/project/project-query.dto';
import { createPagination, PaginatedResult } from '../utils/pagination';
import { ActionType } from '../entities/ProjectHistory';
import { In } from 'typeorm';

export class ProjectService {
  private projectRepository = AppDataSource.getRepository(Project);
  private userRepository = AppDataSource.getRepository(User);
  private projectMemberRepository = AppDataSource.getRepository(ProjectMember);
  private projectHistoryRepository = AppDataSource.getRepository(ProjectHistory);

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get user
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Create project
      const project = new Project();
      project.name = createProjectDto.name;
      project.description = createProjectDto.description;
      project.deadline = new Date(createProjectDto.deadline);
      project.images = createProjectDto.images || [];
      project.owner = user;
      project.ownerId = user.id;

      const savedProject = await queryRunner.manager.save(project);

      // Add project members if any
      if (createProjectDto.memberIds && createProjectDto.memberIds.length > 0) {
        const members = await this.userRepository.findBy({ id: In(createProjectDto.memberIds) });
        
        for (const member of members) {
          const projectMember = new ProjectMember();
          projectMember.project = savedProject;
          projectMember.projectId = savedProject.id;
          projectMember.user = member;
          projectMember.userId = member.id;

          await queryRunner.manager.save(projectMember);
        }
      }

      // Track history
      const history = new ProjectHistory();
      history.project = savedProject;
      history.projectId = savedProject.id;
      history.user = user;
      history.userId = user.id;
      history.action = ActionType.CREATE;
      history.changes = {
        name: savedProject.name,
        description: savedProject.description,
        deadline: savedProject.deadline,
        status: savedProject.status,
        images: savedProject.images
      };

      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      return savedProject;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: ProjectQueryDto, userId: string, userRole: UserRole): Promise<PaginatedResult<Project>> {
    const { 
      search, 
      status, 
      ownerId, 
      startDate, 
      endDate, 
      sortBy = 'createdAt', 
      sortOrder = 'DESC',
      page = 1, 
      limit = 10 
    } = query;

    const queryBuilder = this.projectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser');

    // Filter by user access (admin can see all, users only see their own or where they are members)
    if (userRole !== UserRole.ADMIN) {
      queryBuilder.where('project.ownerId = :userId', { userId })
        .orWhere('members.userId = :userId', { userId });
    }

    // Apply filters
    if (search) {
      queryBuilder.andWhere('(project.name LIKE :search OR project.description LIKE :search)', 
        { search: `%${search}%` });
    }

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    if (ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId });
    }

    if (startDate) {
      queryBuilder.andWhere('project.deadline >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('project.deadline <= :endDate', { endDate });
    }

    // Apply sorting
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results
    const [projects, total] = await queryBuilder.getManyAndCount();

    return createPagination(projects, total, { page, limit });
  }

  async findById(id: string, userId: string, userRole: UserRole): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user']
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Check user access
    if (userRole !== UserRole.ADMIN && 
        project.ownerId !== userId && 
        !project.members.some(member => member.userId === userId)) {
      throw new AppError('You do not have permission to access this project', 403);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string, userRole: UserRole): Promise<Project> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get project with relations
      const project = await this.projectRepository.findOne({
        where: { id },
        relations: ['owner', 'members']
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Check permissions (only admin or project owner can update)
      if (userRole !== UserRole.ADMIN && project.ownerId !== userId) {
        throw new AppError('You do not have permission to update this project', 403);
      }

      // Store original values for history
      const originalValues = {
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        status: project.status,
        images: project.images
      };

      // Update project
      if (updateProjectDto.name) project.name = updateProjectDto.name;
      if (updateProjectDto.description) project.description = updateProjectDto.description;
      if (updateProjectDto.deadline) project.deadline = new Date(updateProjectDto.deadline);
      if (updateProjectDto.status) project.status = updateProjectDto.status;
      if (updateProjectDto.images) project.images = updateProjectDto.images;

      // Save project
      const updatedProject = await queryRunner.manager.save(project);

      // Handle members update if provided
      if (updateProjectDto.memberIds) {
        // Remove existing members
        await queryRunner.manager.delete(ProjectMember, { projectId: project.id });

        // Add new members
        const members = await this.userRepository.findBy({ id: In(updateProjectDto.memberIds) });
        
        for (const member of members) {
          const projectMember = new ProjectMember();
          projectMember.project = updatedProject;
          projectMember.projectId = updatedProject.id;
          projectMember.user = member;
          projectMember.userId = member.id;

          await queryRunner.manager.save(projectMember);
        }
      }

      // Track history
      const user = await this.userRepository.findOneBy({ id: userId });
      
      const history = new ProjectHistory();
      history.project = updatedProject;
      history.projectId = updatedProject.id;
      history.user = user!;
      history.userId = userId;
      history.action = ActionType.UPDATE;
      history.changes = {
        before: originalValues,
        after: {
          name: updatedProject.name,
          description: updatedProject.description,
          deadline: updatedProject.deadline,
          status: updatedProject.status,
          images: updatedProject.images
        }
      };

      await queryRunner.manager.save(history);

      await queryRunner.commitTransaction();

      return updatedProject;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: ProjectStatus, userId: string, userRole: UserRole): Promise<Project> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const project = await this.projectRepository.findOne({
        where: { id },
        relations: ['owner']
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Check permissions (only admin or project owner can update status)
      if (userRole !== UserRole.ADMIN && project.ownerId !== userId) {
        throw new AppError('You do not have permission to update this project status', 403);
      }

      const originalStatus = project.status;
      project.status = status;

      const updatedProject = await queryRunner.manager.save(project);

      // Track history
      const user = await this.userRepository.findOneBy({ id: userId });
      
      const history = new ProjectHistory();
      history.project = updatedProject;
      history.projectId = updatedProject.id;
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

      return updatedProject;
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
      const project = await this.projectRepository.findOne({
        where: { id },
        relations: ['owner']
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Only admin can delete projects
      if (userRole !== UserRole.ADMIN) {
        throw new AppError('Only admin can delete projects', 403);
      }

      // Track history before deletion
      const user = await this.userRepository.findOneBy({ id: userId });
      
      const history = new ProjectHistory();
      history.project = project;
      history.projectId = project.id;
      history.user = user!;
      history.userId = userId;
      history.action = ActionType.DELETE;
      history.changes = {
        name: project.name,
        description: project.description,
        status: project.status,
        deadline: project.deadline
      };

      await queryRunner.manager.save(history);

      // Delete project members
      await queryRunner.manager.delete(ProjectMember, { projectId: id });

      // Delete project
      await queryRunner.manager.delete(Project, id);

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getProjectHistory(id: string, userId: string, userRole: UserRole): Promise<ProjectHistory[]> {
    // Check project exists and user has access
    const project = await this.findById(id, userId, userRole);

    // Get history
    const history = await this.projectHistoryRepository.find({
      where: { projectId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    return history;
  }
}