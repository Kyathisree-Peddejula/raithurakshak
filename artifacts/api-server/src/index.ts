import app from "./app";
import { logger } from "./lib/logger";
import { startWeatherSync } from "./services/weatherSync";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start the live weather sync loop.
  // Fetches current weather from OpenWeatherMap for every farmer district,
  // maps conditions to lightning risk levels, and upserts into weather_data.
  // Runs immediately on startup, then repeats every 30 minutes.
  // Requires OPENWEATHER_API_KEY to be set as a Replit secret.
  startWeatherSync();
});
