import { Response } from "express";

export function sendSuccess<T>(response: Response, statusCode: number, data: T) {
  return response.status(statusCode).json({
    success: true,
    data,
  });
}
