import { Router } from "express";
import { AppError } from "../errors/app-error.js";
import { sendSuccess } from "../http/responses.js";
import { HolidaysClient } from "../services/holidays-client.js";

export function createHolidayRoutes(holidaysClient: HolidaysClient) {
  const router = Router();

  router.get("/holidays/:year", async (request, response, next) => {
    try {
      const year = Number(request.params.year);

      if (!Number.isInteger(year) || year < 1900 || year > 2999) {
        throw new AppError(400, "VALIDATION_ERROR", "year must be a valid year");
      }

      const holidays = await holidaysClient.listByYear(year);
      return sendSuccess(response, 200, holidays);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
