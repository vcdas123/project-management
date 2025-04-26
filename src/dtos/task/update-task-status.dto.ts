import { IsNotEmpty, IsEnum } from 'class-validator';
import { TaskStatus } from '../../entities/Task';

export class UpdateTaskStatusDto {
  @IsNotEmpty({ message: 'Task status is required' })
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status: TaskStatus;
}