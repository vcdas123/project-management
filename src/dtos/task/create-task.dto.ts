import { IsNotEmpty, IsString, IsArray, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Task name is required' })
  @IsString({ message: 'Task name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Task description is required' })
  @IsString({ message: 'Task description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'Task deadline is required' })
  @IsDateString({}, { message: 'Task deadline must be a valid date' })
  deadline: string;

  @IsNotEmpty({ message: 'Project ID is required' })
  @IsUUID('all', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsOptional()
  @IsArray({ message: 'Task images must be an array' })
  images: string[];

  @IsOptional()
  @IsArray({ message: 'Task members must be an array' })
  @IsUUID('all', { each: true, message: 'Each member ID must be a valid UUID' })
  memberIds: string[];
}