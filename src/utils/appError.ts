export class AppError extends Error {
  statusCode: number;
  status: string;
  data?: Object;
  isOperational: boolean;

  constructor(message: string, statusCode: number, data?: Object) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    if (data) this.data = data;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
