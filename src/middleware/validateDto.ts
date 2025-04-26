import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Convert request body to DTO class instance
    const dtoObj = plainToClass(dtoClass, req.body);

    // Validate
    const errors = await validate(dtoObj, { whitelist: true, forbidNonWhitelisted: true });

    if (errors.length > 0) {
      // Format validation errors
      const validationErrors = errors.map(error => {
        const constraints = error.constraints ? Object.values(error.constraints) : ['Invalid value'];
        return {
          property: error.property,
          errors: constraints
        };
      });

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // If validation passes, continue
    req.body = dtoObj;
    next();
  };
};