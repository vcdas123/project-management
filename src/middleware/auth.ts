import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../database/connection';
import { User, UserRole } from '../entities/User';
import { AppError } from '../utils/appError';
import { verifyToken } from '../utils/jwt';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Check for auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No authentication token, access denied', 401));
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Invalid authentication token format', 401));
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.userId });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.isActive) {
      return next(new AppError('User account is inactive', 403));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Invalid authentication token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('User not authorized to access this resource', 403));
    }

    next();
  };
};