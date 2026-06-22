/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OpenWeatherMap Weather Sync Service
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Fetches live weather data for every district that has registered farmers,
 * maps the conditions to a lightning risk level, and upserts the results into
 * the weather_data table so that dashboards and the risk engine always reflect
 * current conditions.
 *
 * API used: OpenWeatherMap Current Weather Data (free tier)
 * Docs: https://openweathermap.org/current
 */

import { db } from "@workspace/db";
import { farmersTable, weatherDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

// ── Configuration ──────────────────────────────────────────────────────────────
// Set OPENWEATHER_API_KEY as a Replit secret (never hard-code it here).
// Get a free key at https://home.openweathermap.org/users/sign_up
const OPENWEATHER_API_KEY = process.env["OPENWEATHER_API_KEY"] ?? "";

// OpenWeatherMap free-tier endpoint for current weather by city name.
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Country code appended to district name for better geocoding accuracy.
// Change to "PK", "BD", etc. if operating outside India.
const COUNTRY_CODE = "IN";

// How often to automatically re-fetch weather data (milliseconds).
// 30 minutes keeps data fresh without hammering the free-tier rate limit.
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

// Abort HTTP requests that take too long (prevents hanging the sync loop).
const FETCH_TIMEOUT_MS = 8_000;
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of the fields we use from the OpenWeather API response. */
interface OWMResponse {
  weather: { id: number; main: string; description: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
  name: string;
  cod: number;
}

/**
 * Maps an OpenWeatherMap condition ID + wind speed to one of our four
 * lightning risk levels (low / medium / high / critical).
 *
 * Condition ID groups (see https://openweathermap.org/weather-conditions):
 *   2xx = Thunderstorm   → always critical (direct lightning hazard)
 *   3xx = Drizzle        → medium
 *   5xx = Rain           → medium, high if wind is strong
 *   6xx = Snow           → low
 *   7xx = Atmosphere     → medium (fog/dust can accompany storms)
 *   800 = Clear sky      → low
 *   8xx = Clouds         → low, medium if windy
 */
function mapToLightningRisk(conditionId: number, windSpeedMs: number): string {
  const highWind = windSpeedMs >= 10;      // ≥ 36 km/h
  const veryHighWind = windSpeedMs >= 15;  // ≥ 54 km/h

  // Thunderstorm → always critical regardless of wind
  if (conditionId >= 200 && conditionId < 300) return "critical";

  // Very strong standalone wind is itself a high-risk hazard
  if (veryHighWind) return "high";

  // Rain
  if (conditionId >= 500 && conditionId < 600) {
    return highWind ? "high" : "medium";
  }

  // Drizzle
  if (conditionId >= 300 && conditionId < 400) return "medium";

  // Atmospheric (fog, mist, haze, dust storms)
  if (conditionId >= 700 && conditionId < 800) {
    return highWind ? "high" : "medium";
  }

  // Clear sky
  if (conditionId === 800) return "low";

  // Cloudy — windy clouds can signal incoming storms
  if (conditionId > 800 && conditionId < 900) {
    return highWind ? "medium" : "low";
  }

  return "low"; // safe default for any unrecognised code
}

/**
 * Calls the OpenWeather API for a single district name.
 * Returns null if the request fails or the district is not recognised.
 */
async function fetchWeatherForDistrict(district: string): Promise<{
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  lightningRisk: string;
} | null> {
  const url =
    `${OPENWEATHER_BASE_URL}?q=${encodeURIComponent(district)},${COUNTRY_CODE}` +
    `&appid=${OPENWEATHER_API_KEY}&units=metric`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logger.warn({ district, status: response.status, body }, "OpenWeather API returned non-2xx");
      return null;
    }

    const data = (await response.json()) as OWMResponse;

    // data.weather is always an array; guard against an empty one.
    const weatherEntry = data.weather[0];
    if (!weatherEntry) {
      logger.warn({ district }, "OpenWeather response missing weather array");
      return null;
    }

    const conditionId = weatherEntry.id;
    const windSpeedMs = data.wind?.speed ?? 0;

    return {
      temperature: Math.round(data.main.temp * 10) / 10,   // 1 decimal place
      humidity: Math.round(data.main.humidity),
      windSpeed: Math.round(windSpeedMs * 10) / 10,
      condition: weatherEntry.description
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      lightningRisk: mapToLightningRisk(conditionId, windSpeedMs),
    };
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      logger.warn({ district }, "OpenWeather request timed out");
    } else {
      logger.warn({ district, err }, "OpenWeather fetch error");
    }
    return null;
  }
}

/**
 * Fetches all unique districts from the farmers table and syncs weather for
 * each one. Upserts into weather_data so existing records are updated in-place.
 *
 * Returns a summary: how many districts were found, updated, and failed.
 */
export async function syncAllDistricts(): Promise<{
  total: number;
  updated: number;
  failed: number;
  skipped: boolean;
}> {
  // Guard: if no API key is configured, log once and bail out gracefully.
  if (!OPENWEATHER_API_KEY) {
    logger.warn(
      "OPENWEATHER_API_KEY is not set — weather sync is disabled. " +
      "Add your key as a Replit secret to enable live weather updates."
    );
    return { total: 0, updated: 0, failed: 0, skipped: true };
  }

  // Get every unique district that has at least one registered farmer.
  const rows = await db
    .selectDistinct({ district: farmersTable.district })
    .from(farmersTable)
    .orderBy(farmersTable.district);

  const districts = rows.map(r => r.district);
  logger.info({ count: districts.length }, "Weather sync started");

  let updated = 0;
  let failed = 0;

  for (const district of districts) {
    const weather = await fetchWeatherForDistrict(district);

    if (!weather) {
      failed++;
      continue;
    }

    // Upsert: update existing row or insert a new one.
    const [existing] = await db
      .select({ id: weatherDataTable.id })
      .from(weatherDataTable)
      .where(eq(weatherDataTable.district, district))
      .limit(1);

    if (existing) {
      await db
        .update(weatherDataTable)
        .set({ ...weather, updatedAt: new Date() })
        .where(eq(weatherDataTable.district, district));
    } else {
      await db
        .insert(weatherDataTable)
        .values({ district, ...weather });
    }

    logger.info({ district, risk: weather.lightningRisk, temp: weather.temperature }, "Weather updated");
    updated++;
  }

  logger.info({ total: districts.length, updated, failed }, "Weather sync complete");
  return { total: districts.length, updated, failed, skipped: false };
}

/** Last sync result, exposed via the status endpoint. */
let lastSyncResult: Awaited<ReturnType<typeof syncAllDistricts>> | null = null;
let lastSyncAt: Date | null = null;

export function getLastSyncStatus() {
  return { result: lastSyncResult, syncedAt: lastSyncAt?.toISOString() ?? null };
}

/**
 * Starts the automatic weather sync loop.
 * Runs immediately on startup, then repeats every REFRESH_INTERVAL_MS.
 * Call this once from index.ts after the server begins listening.
 */
export function startWeatherSync() {
  if (!OPENWEATHER_API_KEY) {
    logger.warn(
      "Weather auto-sync disabled: OPENWEATHER_API_KEY secret is not configured. " +
      `Set it in Replit Secrets to enable live weather updates (refreshes every ${REFRESH_INTERVAL_MS / 60_000} min).`
    );
    return;
  }

  // Run the first sync right away so data is fresh from the moment the server starts.
  const run = async () => {
    lastSyncResult = await syncAllDistricts();
    lastSyncAt = new Date();
  };

  run().catch(err => logger.error({ err }, "Initial weather sync failed"));

  // Schedule subsequent syncs on a fixed interval.
  const interval = setInterval(() => {
    run().catch(err => logger.error({ err }, "Periodic weather sync failed"));
  }, REFRESH_INTERVAL_MS);

  // Allow the Node.js process to exit cleanly even if the interval is pending.
  interval.unref();

  logger.info(
    { intervalMinutes: REFRESH_INTERVAL_MS / 60_000 },
    "Weather auto-sync scheduled"
  );
}
