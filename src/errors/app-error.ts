export type ErrorCode =
  | "VALIDATION_ERROR"
  | "TRIP_REQUEST_NOT_FOUND"
  | "TRIP_REQUEST_ALREADY_CANCELED"
  | "HOLIDAY_TRIP_NOT_ALLOWED"
  | "HOLIDAYS_API_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
