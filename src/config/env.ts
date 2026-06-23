import dotenv from "dotenv";

dotenv.config();

export interface Env {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  holidaysApiBaseUrl: string;
}

export function loadEnv(): Env {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 3000),
    databaseUrl:
      process.env.DATABASE_URL ??
      "postgres://trip_user:trip_password@localhost:5432/trip_requests",
    holidaysApiBaseUrl:
      process.env.HOLIDAYS_API_BASE_URL ?? "https://brasilapi.com.br",
  };
}
