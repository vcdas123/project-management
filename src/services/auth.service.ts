import { AppDataSource } from "../database/connection";
import { User, UserRole } from "../entities/User";
import { AppError } from "../utils/appError";
import { generateToken, generateRefreshToken } from "../utils/jwt";
import { sendEmail, generatePasswordResetEmail } from "../utils/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { RegisterDto } from "../dtos/auth/register.dto";
import { LoginDto } from "../dtos/auth/login.dto";
import { ForgotPasswordDto } from "../dtos/auth/forgot-password.dto";
import { ResetPasswordDto } from "../dtos/auth/reset-password.dto";
import { UpdatePasswordDto } from "../dtos/auth/update-password.dto";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(
    registerDto: RegisterDto
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    const { firstName, lastName, email, password } = registerDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: UserRole.USER,
    });

    await this.userRepository.save(user);

    // Remove password from response
    const userWithoutPassword: any = { ...user };
    delete userWithoutPassword.password;

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user: userWithoutPassword, token, refreshToken };
  }

  async login(
    loginDto: LoginDto
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    const { email, password } = loginDto;

    // Find user with password
    let user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      throw new AppError("User account is inactive", 403);
    }

    // Remove password from response
    const userWithoutPassword: any = { ...user };
    delete userWithoutPassword.password;

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return { user: userWithoutPassword, token, refreshToken };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<boolean> {
    const { email } = forgotPasswordDto;

    // Find user
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      // Don't reveal user existence
      return true;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await this.userRepository.save(user);

    // Send email
    const emailOptions = generatePasswordResetEmail(email, resetToken);
    return await sendEmail(emailOptions);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<boolean> {
    const { token, password } = resetPasswordDto;

    // Hash token
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await this.userRepository
      .createQueryBuilder("user")
      .where("user.passwordResetToken = :token", { token: passwordResetToken })
      .andWhere("user.passwordResetExpires > :date", { date: new Date() })
      .getOne();

    if (!user) {
      throw new AppError("Invalid or expired token", 400);
    }

    // Update password
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);

    return true;
  }

  async updatePassword(
    userId: string,
    updatePasswordDto: UpdatePasswordDto
  ): Promise<boolean> {
    const { currentPassword, newPassword } = updatePasswordDto;

    // Find user with password
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id: userId })
      .getOne();

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check current password
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);

    return true;
  }
}
