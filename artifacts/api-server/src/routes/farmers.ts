import { Router } from "express";
import { db } from "@workspace/db";
import { farmersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/farmers", async (req, res) => {
  try {
    const farmers = await db.select().from(farmersTable).orderBy(farmersTable.registeredAt);
    res.json(farmers.map(f => ({
      ...f,
      registeredAt: f.registeredAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list farmers" });
  }
});

router.post("/farmers", async (req, res) => {
  try {
    const { name, phone, aadhaar, village, district, state, lat, lng } = req.body;
    if (!name || !phone || !village || !district || !state) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [farmer] = await db.insert(farmersTable).values({
      name, phone, aadhaar: aadhaar || null, village, district, state,
      lat: lat ?? null, lng: lng ?? null, isActive: true,
    }).returning();
    res.status(201).json({ ...farmer, registeredAt: farmer.registeredAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to register farmer" });
  }
});

router.get("/farmers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, id));
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });
    res.json({ ...farmer, registeredAt: farmer.registeredAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get farmer" });
  }
});

router.patch("/farmers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, village, district, state, lat, lng, isActive } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (village !== undefined) updates.village = village;
    if (district !== undefined) updates.district = district;
    if (state !== undefined) updates.state = state;
    if (lat !== undefined) updates.lat = lat;
    if (lng !== undefined) updates.lng = lng;
    if (isActive !== undefined) updates.isActive = isActive;
    const [farmer] = await db.update(farmersTable).set(updates).where(eq(farmersTable.id, id)).returning();
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });
    res.json({ ...farmer, registeredAt: farmer.registeredAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update farmer" });
  }
});

router.delete("/farmers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(farmersTable).where(eq(farmersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete farmer" });
  }
});

export default router;
