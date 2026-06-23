import { Pool } from "pg";
import { TripRequest, TripRequestStatus } from "../types.js";

export interface TripRequestRepository {
  create(input: Omit<TripRequest, "id">): Promise<TripRequest>;
  findAll(): Promise<TripRequest[]>;
  findById(id: string): Promise<TripRequest | null>;
  updateStatus(id: string, status: TripRequestStatus): Promise<TripRequest | null>;
}

function toTripRequest(row: Record<string, unknown>): TripRequest {
  return {
    id: String(row.id),
    requesterName: String(row.requester_name),
    origin: String(row.origin),
    destination: String(row.destination),
    departureAt: String(row.departure_at),
    returnAt: String(row.return_at),
    purpose: String(row.purpose),
    passengerCount: Number(row.passenger_count),
    status: row.status as TripRequestStatus,
    createdAt: String(row.created_at),
  };
}

export class PostgresTripRequestRepository implements TripRequestRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: Omit<TripRequest, "id">): Promise<TripRequest> {
    const result = await this.pool.query(
      `INSERT INTO trip_requests
        (requester_name, origin, destination, departure_at, return_at, purpose, passenger_count, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, requester_name, origin, destination, departure_at, return_at, purpose, passenger_count, status, created_at`,
      [
        input.requesterName,
        input.origin,
        input.destination,
        input.departureAt,
        input.returnAt,
        input.purpose,
        input.passengerCount,
        input.status,
        input.createdAt,
      ],
    );

    return toTripRequest(result.rows[0]);
  }

  async findAll(): Promise<TripRequest[]> {
    const result = await this.pool.query(
      `SELECT id, requester_name, origin, destination, departure_at, return_at, purpose, passenger_count, status, created_at
       FROM trip_requests
       ORDER BY created_at DESC, id DESC`,
    );

    return result.rows.map(toTripRequest);
  }

  async findById(id: string): Promise<TripRequest | null> {
    const result = await this.pool.query(
      `SELECT id, requester_name, origin, destination, departure_at, return_at, purpose, passenger_count, status, created_at
       FROM trip_requests
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? toTripRequest(result.rows[0]) : null;
  }

  async updateStatus(id: string, status: TripRequestStatus): Promise<TripRequest | null> {
    const result = await this.pool.query(
      `UPDATE trip_requests
       SET status = $2
       WHERE id = $1
       RETURNING id, requester_name, origin, destination, departure_at, return_at, purpose, passenger_count, status, created_at`,
      [id, status],
    );

    return result.rows[0] ? toTripRequest(result.rows[0]) : null;
  }
}
