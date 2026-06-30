import { Router } from "express";
import { sendSuccess } from "../http/responses.js";
import { TripRequestService } from "../services/trip-request-service.js";

export function createTripRequestRoutes(tripRequestService: TripRequestService) {
  const router = Router();

  router.post("/trip-requests", async (request, response, next) => {
    try {
      const tripRequest = await tripRequestService.create(request.body);
      return sendSuccess(response, 201, tripRequest);
    } catch (error) {
      return next(error);
    }
  });

  router.get("/trip-requests", async (request, response, next) => {
    try {
      const tripRequests = await tripRequestService.findAll(request.query);
      return sendSuccess(response, 200, tripRequests);
    } catch (error) {
      return next(error);
    }
  });

  router.get("/trip-requests/:id", async (request, response, next) => {
    try {
      const tripRequest = await tripRequestService.findById(request.params.id);
      return sendSuccess(response, 200, tripRequest);
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/trip-requests/:id/cancel", async (request, response, next) => {
    try {
      const tripRequest = await tripRequestService.cancel(request.params.id);
      return sendSuccess(response, 200, tripRequest);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
