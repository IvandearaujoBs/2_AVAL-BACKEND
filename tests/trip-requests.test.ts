import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { TripRequestRepository } from "../src/repositories/trip-request-repository.js";
import { HolidaysClient } from "../src/services/holidays-client.js";
import { Holiday, TripRequest, TripRequestFilters, TripRequestStatus } from "../src/types.js";

class InMemoryTripRequestRepository implements TripRequestRepository {
  private tripRequests: TripRequest[] = [];
  private nextId = 1;

  async create(input: Omit<TripRequest, "id">): Promise<TripRequest> {
    const tripRequest = {
      id: String(this.nextId),
      ...input,
    };

    this.nextId += 1;
    this.tripRequests.push(tripRequest);
    return tripRequest;
  }

  async findAll(filters: TripRequestFilters = {}): Promise<TripRequest[]> {
    return this.tripRequests.filter((tripRequest) => {
      const matchesStatus = !filters.status || tripRequest.status === filters.status;
      const matchesOrigin =
        !filters.origin ||
        tripRequest.origin.toLowerCase().includes(filters.origin.toLowerCase());
      const matchesDestination =
        !filters.destination ||
        tripRequest.destination.toLowerCase().includes(filters.destination.toLowerCase());
      const matchesRequesterName =
        !filters.requesterName ||
        tripRequest.requesterName.toLowerCase().includes(filters.requesterName.toLowerCase());
      const matchesDepartureFrom =
        !filters.departureFrom || tripRequest.departureAt >= filters.departureFrom;
      const matchesDepartureTo =
        !filters.departureTo || tripRequest.departureAt <= filters.departureTo;

      return (
        matchesStatus &&
        matchesOrigin &&
        matchesDestination &&
        matchesRequesterName &&
        matchesDepartureFrom &&
        matchesDepartureTo
      );
    });
  }

  async findById(id: string): Promise<TripRequest | null> {
    return this.tripRequests.find((tripRequest) => tripRequest.id === id) ?? null;
  }

  async updateStatus(id: string, status: TripRequestStatus): Promise<TripRequest | null> {
    const tripRequest = await this.findById(id);

    if (!tripRequest) {
      return null;
    }

    tripRequest.status = status;
    return tripRequest;
  }
}

class FakeHolidaysClient implements HolidaysClient {
  public holidaysByYear = new Map<number, Holiday[]>();

  async listByYear(year: number): Promise<Holiday[]> {
    return this.holidaysByYear.get(year) ?? [];
  }
}

const validBody = {
  requesterName: "Maria Silva",
  origin: "Parnaiba",
  destination: "Teresina",
  departureAt: "2026-06-24T07:00:00-03:00",
  returnAt: "2026-06-24T18:00:00.000Z",
  purpose: "Participation in an institutional meeting",
  passengerCount: 3,
};

function makeTestApp() {
  const repository = new InMemoryTripRequestRepository();
  const holidaysClient = new FakeHolidaysClient();
  const app = createApp({
    tripRequestRepository: repository,
    holidaysClient,
  });

  return { app, repository, holidaysClient };
}

describe("trip requests", () => {
  let testContext: ReturnType<typeof makeTestApp>;

  beforeEach(() => {
    testContext = makeTestApp();
  });

  it("creates a valid trip request", async () => {
    const response = await request(testContext.app).post("/trip-requests").send(validBody);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      id: "1",
      requesterName: "Maria Silva",
      departureAt: "2026-06-24T10:00:00.000Z",
      status: "pending",
      passengerCount: 3,
    });
  });

  it("rejects creation when returnAt is before departureAt", async () => {
    const response = await request(testContext.app)
      .post("/trip-requests")
      .send({
        ...validBody,
        returnAt: "2026-06-24T09:59:59.000Z",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
      },
    });
  });

  it("rejects creation when passengerCount is less than or equal to zero", async () => {
    const response = await request(testContext.app)
      .post("/trip-requests")
      .send({
        ...validBody,
        passengerCount: 0,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects creation when departureAt is a national holiday", async () => {
    testContext.holidaysClient.holidaysByYear.set(2026, [
      {
        date: "2026-06-24",
        name: "Holiday from fake service",
        type: "national",
      },
    ]);

    const response = await request(testContext.app).post("/trip-requests").send(validBody);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("HOLIDAY_TRIP_NOT_ALLOWED");
  });

  it("returns a standardized error when a trip request does not exist", async () => {
    const response = await request(testContext.app).get("/trip-requests/999");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "TRIP_REQUEST_NOT_FOUND",
        message: "Trip request was not found",
      },
    });
  });

  it("cancels an existing trip request", async () => {
    const created = await request(testContext.app).post("/trip-requests").send(validBody);
    const response = await request(testContext.app).patch(
      `/trip-requests/${created.body.data.id}/cancel`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("canceled");
  });

  it("rejects cancellation when a trip request is already canceled", async () => {
    const created = await request(testContext.app).post("/trip-requests").send(validBody);
    await request(testContext.app).patch(`/trip-requests/${created.body.data.id}/cancel`);

    const response = await request(testContext.app).patch(
      `/trip-requests/${created.body.data.id}/cancel`,
    );

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("TRIP_REQUEST_ALREADY_CANCELED");
  });

  it("filters trip requests by status and destination", async () => {
    await request(testContext.app).post("/trip-requests").send(validBody);
    await request(testContext.app)
      .post("/trip-requests")
      .send({
        ...validBody,
        requesterName: "Carlos Pereira",
        destination: "Picos",
        departureAt: "2026-07-02T11:00:00.000Z",
        returnAt: "2026-07-02T18:00:00.000Z",
      });

    const response = await request(testContext.app).get(
      "/trip-requests?status=pending&destination=Picos",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      requesterName: "Carlos Pereira",
      destination: "Picos",
      status: "pending",
    });
  });

  it("rejects invalid filters with a standardized error", async () => {
    const response = await request(testContext.app).get("/trip-requests?status=approved");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});
