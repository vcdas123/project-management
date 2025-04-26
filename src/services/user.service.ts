import { AppDataSource } from '../database/connection';
import { User, UserRole } from '../entities/User';
import { AppError } from '../utils/appError';
import { UpdateUserDto } from '../dtos/user/update-user.dto';
import { createPagination, PaginatedResult } from '../utils/pagination';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResult<User>> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return createPagination(users, total, { page, limit });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update user properties
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return user;
  }

  async updateRole(id: string, role: UserRole, adminId: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Only admin can change roles
    const admin = await this.userRepository.findOneBy({ id: adminId });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new AppError('Only admin can update user roles', 403);
    }

    user.role = role;
    await this.userRepository.save(user);

    return user;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new AppError('User not found', 404);
    }
    return true;
  }

  async toggleActiveStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = isActive;
    await this.userRepository.save(user);

    return user;
  }
}