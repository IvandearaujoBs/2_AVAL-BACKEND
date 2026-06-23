import pg from "pg";
import { loadEnv } from "./env.js";

const { Pool } = pg;

export function createPool() {
  const env = loadEnv();
  return new Pool({
    connectionString: env.databaseUrl,
  });
}
