import {
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsEnum,
  IsUUID,
} from "class-validator";
import { TaskStatus } from "../../entities/Task";
import { Transform } from "class-transformer";

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: "Task name must be a string" })
  name?: string;

  @IsOptional()
  @IsString({ message: "Task description must be a string" })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: "Task deadline must be a valid date" })
  deadline?: string;

  @IsOptional()
  @IsDateString({}, { message: "Task start date must be a valid date" })
  startDate?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: "Invalid task status" })
  status?: TaskStatus;

  @IsOptional()
  @IsArray({ message: "Task images must be an array" })
  images?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  @IsArray({ message: "Task members must be an array" })
  @IsUUID("all", { each: true, message: "Each member ID must be a valid UUID" })
  memberIds?: string[];
}
