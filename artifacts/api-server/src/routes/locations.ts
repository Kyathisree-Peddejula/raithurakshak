import { Router } from "express";
import { db } from "@workspace/db";
import { locationsTable, farmersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/farmers/:farmerId/location", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId);
    const [location] = await db.select().from(locationsTable)
      .where(eq(locationsTable.farmerId, farmerId))
      .orderBy(desc(locationsTable.recordedAt))
      .limit(1);
    if (!location) return res.status(404).json({ error: "No location found" });
    res.json({ ...location, recordedAt: location.recordedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get location" });
  }
});

router.post("/farmers/:farmerId/location", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId);
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required" });
    }
    const [location] = await db.insert(locationsTable).values({ farmerId, lat, lng }).returning();
    res.json({ ...location, recordedAt: location.recordedAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update location" });
  }
});

router.get("/locations", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT DISTINCT ON (l.farmer_id)
        l.farmer_id as "farmerId",
        f.name as "farmerName",
        f.district,
        l.lat,
        l.lng,
        l.recorded_at as "recordedAt"
      FROM locations l
      JOIN farmers f ON f.id = l.farmer_id
      ORDER BY l.farmer_id, l.recorded_at DESC
    `);
    const result = rows.rows.map((r: Record<string, unknown>) => ({
      ...r,
      recordedAt: r.recordedAt instanceof Date ? (r.recordedAt as Date).toISOString() : r.recordedAt,
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list locations" });
  }
});

export default router;
