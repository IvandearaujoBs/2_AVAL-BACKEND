import express from "express";
import { Pool } from "pg";
import { errorHandler } from "./http/error-handler.js";
import {
  PostgresTripRequestRepository,
  TripRequestRepository,
} from "./repositories/trip-request-repository.js";
import { createHolidayRoutes } from "./routes/holiday-routes.js";
import { createTripRequestRoutes } from "./routes/trip-request-routes.js";
import { BrasilApiHolidaysClient, HolidaysClient } from "./services/holidays-client.js";
import { TripRequestService } from "./services/trip-request-service.js";

interface CreateAppOptions {
  pool?: Pool;
  tripRequestRepository?: TripRequestRepository;
  holidaysClient: HolidaysClient;
}

export function createApp(options: CreateAppOptions) {
  const app = express();
  const repository =
    options.tripRequestRepository ??
    new PostgresTripRequestRepository(options.pool as Pool);
  const tripRequestService = new TripRequestService(repository, options.holidaysClient);

  app.use(express.json());
  app.get("/health", (_request, response) => {
    response.status(200).json({ success: true, data: { status: "ok" } });
  });
  app.use(createTripRequestRoutes(tripRequestService));
  app.use(createHolidayRoutes(options.holidaysClient));
  app.use(errorHandler);

  return app;
}

export function createProductionApp(pool: Pool, holidaysApiBaseUrl: string) {
  return createApp({
    pool,
    holidaysClient: new BrasilApiHolidaysClient(holidaysApiBaseUrl),
  });
}
