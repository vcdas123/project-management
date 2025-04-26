import { IsOptional, IsString, IsArray, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { ProjectStatus } from '../../entities/Project';

export class UpdateProjectDto {
  @IsOptional()
  @IsString({ message: 'Project name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Project description must be a string' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Project deadline must be a valid date' })
  deadline?: string;

  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Invalid project status' })
  status?: ProjectStatus;

  @IsOptional()
  @IsArray({ message: 'Project images must be an array' })
  images?: string[];

  @IsOptional()
  @IsArray({ message: 'Project members must be an array' })
  @IsUUID('all', { each: true, message: 'Each member ID must be a valid UUID' })
  memberIds?: string[];
}