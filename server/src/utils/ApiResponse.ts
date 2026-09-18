import type { Response } from 'express';

export class ApiResponse<T> {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message = 'Error', statusCode = 500, details?: unknown) {
    return res.status(statusCode).json({
      success: false,
      message,
      details,
    });
  }
}