import { AppError } from "../errors/app-error.js";
import { TripRequestRepository } from "../repositories/trip-request-repository.js";
import { CreateTripRequestInput, TripRequest } from "../types.js";
import { HolidaysClient } from "./holidays-client.js";

export class TripRequestService {
  constructor(
    private readonly repository: TripRequestRepository,
    private readonly holidaysClient: HolidaysClient,
  ) {}

  async create(input: unknown): Promise<TripRequest> {
    const validatedInput = this.validateCreateInput(input);
    const departureAt = this.normalizeDate(validatedInput.departureAt, "departureAt");
    const returnAt = this.normalizeDate(validatedInput.returnAt, "returnAt");

    if (new Date(returnAt).getTime() < new Date(departureAt).getTime()) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "returnAt must be greater than or equal to departureAt",
      );
    }

    const departureDate = departureAt.slice(0, 10);
    const year = Number(departureDate.slice(0, 4));
    const holidays = await this.holidaysClient.listByYear(year);
    const isHoliday = holidays.some((holiday) => holiday.date === departureDate);

    if (isHoliday) {
      throw new AppError(
        409,
        "HOLIDAY_TRIP_NOT_ALLOWED",
        "Trip requests cannot start on a national holiday",
      );
    }

    return this.repository.create({
      ...validatedInput,
      departureAt,
      returnAt,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  async findAll(): Promise<TripRequest[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<TripRequest> {
    const tripRequest = await this.repository.findById(id);

    if (!tripRequest) {
      throw new AppError(404, "TRIP_REQUEST_NOT_FOUND", "Trip request was not found");
    }

    return tripRequest;
  }

  async cancel(id: string): Promise<TripRequest> {
    const tripRequest = await this.findById(id);

    if (tripRequest.status === "canceled") {
      throw new AppError(
        409,
        "TRIP_REQUEST_ALREADY_CANCELED",
        "Trip request is already canceled",
      );
    }

    const canceledTripRequest = await this.repository.updateStatus(id, "canceled");

    if (!canceledTripRequest) {
      throw new AppError(404, "TRIP_REQUEST_NOT_FOUND", "Trip request was not found");
    }

    return canceledTripRequest;
  }

  private validateCreateInput(input: unknown): CreateTripRequestInput {
    if (!input || typeof input !== "object") {
      throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
    }

    const payload = input as Record<string, unknown>;
    const requiredTextFields = [
      "requesterName",
      "origin",
      "destination",
      "departureAt",
      "returnAt",
      "purpose",
    ];

    for (const field of requiredTextFields) {
      if (typeof payload[field] !== "string" || payload[field].trim().length === 0) {
        throw new AppError(400, "VALIDATION_ERROR", `${field} is required`);
      }
    }

    if (
      typeof payload.passengerCount !== "number" ||
      !Number.isInteger(payload.passengerCount) ||
      payload.passengerCount <= 0
    ) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "passengerCount must be greater than zero",
      );
    }

    const getTextField = (field: string) => payload[field] as string;

    return {
      requesterName: getTextField("requesterName").trim(),
      origin: getTextField("origin").trim(),
      destination: getTextField("destination").trim(),
      departureAt: getTextField("departureAt").trim(),
      returnAt: getTextField("returnAt").trim(),
      purpose: getTextField("purpose").trim(),
      passengerCount: payload.passengerCount,
    };
  }

  private normalizeDate(value: string, fieldName: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new AppError(400, "VALIDATION_ERROR", `${fieldName} must be a valid ISO 8601 date`);
    }

    return date.toISOString();
  }
}
