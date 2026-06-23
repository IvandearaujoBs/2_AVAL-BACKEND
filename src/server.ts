import { createPool } from "./config/database.js";
import { loadEnv } from "./config/env.js";
import { createProductionApp } from "./app.js";

const env = loadEnv();
const pool = createPool();
const app = createProductionApp(pool, env.holidaysApiBaseUrl);

app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
});
