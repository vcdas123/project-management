import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { AppError } from './appError';
import { config } from '../config';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../', config.upload.directory);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only certain file types
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed!'));
};

// Export multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize // 5MB
  }
});

// Helper function to delete file
export const deleteFile = (filePath: string): boolean => {
  try {
    // Ensure the file is within the uploads directory
    const fullPath = path.join(uploadDir, path.basename(filePath));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Upload multiple files
export const handleMultipleUploads = (fieldName: string, maxCount: number) => {
  return (req: Request, res: any, next: any) => {
    const uploadHandler = upload.array(fieldName, maxCount);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError(`File too large. Max size is ${config.upload.maxFileSize / 1024 / 1024}MB`, 400));
        }
        return next(new AppError(err.message, 400));
      } else if (err) {
        return next(new AppError(err.message, 400));
      }
      next();
    });
  };
};

// Process uploaded files to get paths
export const getUploadedFilePaths = (req: Request): string[] => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return [];

  return files.map(file => `${config.upload.directory}/${file.filename}`);
};