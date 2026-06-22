import { Router } from "express";
import { db } from "@workspace/db";
import { weatherDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { syncAllDistricts, getLastSyncStatus } from "../services/weatherSync";

const router = Router();

// GET /api/weather — list all district weather records
router.get("/weather", async (req, res) => {
  try {
    const data = await db.select().from(weatherDataTable).orderBy(weatherDataTable.district);
    res.json(data.map(d => ({ ...d, updatedAt: d.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list weather data" });
  }
});

// POST /api/weather — manually upsert a single district's weather record
router.post("/weather", async (req, res) => {
  try {
    const { district, temperature, humidity, windSpeed, lightningRisk, condition } = req.body;
    if (!district || temperature === undefined || humidity === undefined || windSpeed === undefined || !lightningRisk || !condition) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [existing] = await db.select().from(weatherDataTable).where(eq(weatherDataTable.district, district));
    let result;
    if (existing) {
      const [updated] = await db.update(weatherDataTable)
        .set({ temperature, humidity, windSpeed, lightningRisk, condition, updatedAt: new Date() })
        .where(eq(weatherDataTable.district, district))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db.insert(weatherDataTable)
        .values({ district, temperature, humidity, windSpeed, lightningRisk, condition })
        .returning();
      result = inserted;
    }
    res.json({ ...result, updatedAt: result.updatedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to upsert weather data" });
  }
});

// POST /api/weather/sync — manually trigger an immediate weather sync for all districts
// Useful for testing or forcing a refresh before the next automatic interval.
router.post("/weather/sync", async (req, res) => {
  try {
    req.log.info("Manual weather sync triggered via API");
    const result = await syncAllDistricts();
    res.json({
      message: result.skipped
        ? "Sync skipped — OPENWEATHER_API_KEY is not configured."
        : `Sync complete: ${result.updated}/${result.total} districts updated, ${result.failed} failed.`,
      ...result,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Weather sync failed" });
  }
});

// GET /api/weather/sync/status — return the result of the last automatic sync
router.get("/weather/sync/status", async (req, res) => {
  const status = getLastSyncStatus();
  res.json({
    configured: !!process.env["OPENWEATHER_API_KEY"],
    ...status,
  });
});

export default router;
