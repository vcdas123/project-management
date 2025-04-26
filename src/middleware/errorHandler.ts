import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default error
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorDetails = {};

  // If it's our custom error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    // For other errors
    message = err.message || 'Something went wrong';
  }

  // Log the error
  logger.error(`Error: ${statusCode} - ${message}`, {
    stack: err.stack,
    ...errorDetails
  });

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.environment === 'development' && { stack: err.stack })
  });
};