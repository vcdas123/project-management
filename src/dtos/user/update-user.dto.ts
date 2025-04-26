import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name must be at most 100 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name must be at most 100 characters' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Profile image must be a string' })
  profileImage?: string;
}