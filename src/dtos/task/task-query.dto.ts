import { IsOptional, IsEnum, IsString, IsDate, IsUUID } from 'class-validator';
import { TaskStatus } from '../../entities/Task';
import { Transform } from 'class-transformer';

export class TaskQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  assignedById?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}