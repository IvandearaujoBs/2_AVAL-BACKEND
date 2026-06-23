import pg from "pg";
import { loadEnv } from "../src/config/env.js";

const { Pool } = pg;

const seedTripRequests = [
  {
    requesterName: "Maria Silva",
    origin: "Parnaiba",
    destination: "Teresina",
    departureAt: "2026-06-24T10:00:00.000Z",
    returnAt: "2026-06-24T18:00:00.000Z",
    purpose: "Participation in an institutional meeting",
    passengerCount: 3,
  },
  {
    requesterName: "Joao Sousa",
    origin: "Teresina",
    destination: "Picos",
    departureAt: "2026-07-02T11:00:00.000Z",
    returnAt: "2026-07-03T20:00:00.000Z",
    purpose: "Research project activity",
    passengerCount: 2,
  },
  {
    requesterName: "Ana Costa",
    origin: "Floriano",
    destination: "Teresina",
    departureAt: "2026-08-10T09:00:00.000Z",
    returnAt: "2026-08-10T22:00:00.000Z",
    purpose: "Administrative meeting",
    passengerCount: 4,
  },
  {
    requesterName: "Carlos Pereira",
    origin: "Campo Maior",
    destination: "Piripiri",
    departureAt: "2026-09-14T12:00:00.000Z",
    returnAt: "2026-09-15T17:00:00.000Z",
    purpose: "Teaching supervision",
    passengerCount: 5,
  },
  {
    requesterName: "Beatriz Lima",
    origin: "Teresina",
    destination: "Oeiras",
    departureAt: "2026-10-05T10:30:00.000Z",
    returnAt: "2026-10-06T19:30:00.000Z",
    purpose: "Extension program visit",
    passengerCount: 6,
  },
  {
    requesterName: "Rafael Alves",
    origin: "Picos",
    destination: "Sao Raimundo Nonato",
    departureAt: "2026-11-09T08:00:00.000Z",
    returnAt: "2026-11-11T21:00:00.000Z",
    purpose: "Academic event participation",
    passengerCount: 3,
  },
  {
    requesterName: "Lucia Rocha",
    origin: "Teresina",
    destination: "Parnaiba",
    departureAt: "2026-12-02T13:00:00.000Z",
    returnAt: "2026-12-04T20:00:00.000Z",
    purpose: "Institutional workshop",
    passengerCount: 7,
  },
  {
    requesterName: "Pedro Martins",
    origin: "Urucui",
    destination: "Teresina",
    departureAt: "2027-02-03T10:00:00.000Z",
    returnAt: "2027-02-03T23:00:00.000Z",
    purpose: "Document delivery",
    passengerCount: 1,
  },
  {
    requesterName: "Camila Nunes",
    origin: "Piripiri",
    destination: "Teresina",
    departureAt: "2027-03-08T11:30:00.000Z",
    returnAt: "2027-03-09T18:00:00.000Z",
    purpose: "Research committee meeting",
    passengerCount: 2,
  },
  {
    requesterName: "Marcos Oliveira",
    origin: "Teresina",
    destination: "Floriano",
    departureAt: "2027-04-12T09:45:00.000Z",
    returnAt: "2027-04-13T16:45:00.000Z",
    purpose: "Campus technical visit",
    passengerCount: 4,
  },
];

async function main() {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.databaseUrl });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_requests (
        id BIGSERIAL PRIMARY KEY,
        requester_name TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_at TEXT NOT NULL,
        return_at TEXT NOT NULL,
        purpose TEXT NOT NULL,
        passenger_count INTEGER NOT NULL CHECK (passenger_count > 0),
        status TEXT NOT NULL CHECK (status IN ('pending', 'canceled')),
        created_at TEXT NOT NULL
      );
    `);

    await pool.query("TRUNCATE TABLE trip_requests RESTART IDENTITY;");

    for (const tripRequest of seedTripRequests) {
      await pool.query(
        `INSERT INTO trip_requests
          (requester_name, origin, destination, departure_at, return_at, purpose, passenger_count, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
        [
          tripRequest.requesterName,
          tripRequest.origin,
          tripRequest.destination,
          tripRequest.departureAt,
          tripRequest.returnAt,
          tripRequest.purpose,
          tripRequest.passengerCount,
          new Date().toISOString(),
        ],
      );
    }

    console.log("Database initialized with 10 trip requests");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to initialize database");
  console.error(error);
  process.exit(1);
});
