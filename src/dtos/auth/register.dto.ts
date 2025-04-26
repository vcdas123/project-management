import { IsNotEmpty, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100, { message: 'First name must be at most 100 characters' })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name must be at most 100 characters' })
  lastName: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character'
  })
  password: string;
}