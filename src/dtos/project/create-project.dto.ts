import { IsNotEmpty, IsString, IsArray, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Project name is required' })
  @IsString({ message: 'Project name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Project description is required' })
  @IsString({ message: 'Project description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'Project deadline is required' })
  @IsDateString({}, { message: 'Project deadline must be a valid date' })
  deadline: string;

  @IsOptional()
  @IsArray({ message: 'Project images must be an array' })
  images: string[];

  @IsOptional()
  @IsArray({ message: 'Project members must be an array' })
  @IsUUID('all', { each: true, message: 'Each member ID must be a valid UUID' })
  memberIds: string[];
}