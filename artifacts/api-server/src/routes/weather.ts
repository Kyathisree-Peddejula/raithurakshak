import { Router } from "express";
import { db } from "@workspace/db";
import { weatherDataTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/weather", async (req, res) => {
  try {
    const data = await db.select().from(weatherDataTable).orderBy(weatherDataTable.district);
    res.json(data.map(d => ({ ...d, updatedAt: d.updatedAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list weather data" });
  }
});

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

export default router;
