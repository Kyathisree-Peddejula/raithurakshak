import { Router } from "express";
import { db } from "@workspace/db";
import { lightningAlertsTable, emergencyAlertsTable, farmersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Lightning alerts
router.get("/alerts/lightning", async (req, res) => {
  try {
    const alerts = await db.select().from(lightningAlertsTable).orderBy(lightningAlertsTable.createdAt);
    res.json(alerts.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list lightning alerts" });
  }
});

router.post("/alerts/lightning", async (req, res) => {
  try {
    const { district, severity, message, messageTe } = req.body;
    if (!district || !severity || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [alert] = await db
      .insert(lightningAlertsTable)
      .values({ district, severity, message, messageTe: messageTe ?? null, isActive: true })
      .returning();
    res.status(201).json({ ...alert, createdAt: alert.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create lightning alert" });
  }
});

router.delete("/alerts/lightning/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(lightningAlertsTable).where(eq(lightningAlertsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete lightning alert" });
  }
});

// Emergency alerts
router.get("/alerts/emergency", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: emergencyAlertsTable.id,
        farmerId: emergencyAlertsTable.farmerId,
        farmerName: farmersTable.name,
        type: emergencyAlertsTable.type,
        message: emergencyAlertsTable.message,
        lat: emergencyAlertsTable.lat,
        lng: emergencyAlertsTable.lng,
        isResolved: emergencyAlertsTable.isResolved,
        createdAt: emergencyAlertsTable.createdAt,
      })
      .from(emergencyAlertsTable)
      .leftJoin(farmersTable, eq(emergencyAlertsTable.farmerId, farmersTable.id))
      .orderBy(emergencyAlertsTable.createdAt);
    res.json(rows.map(r => ({ ...r, farmerName: r.farmerName ?? "Unknown", createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list emergency alerts" });
  }
});

router.post("/alerts/emergency", async (req, res) => {
  try {
    const { farmerId, type, message, lat, lng } = req.body;
    if (!farmerId || !type || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [alert] = await db.insert(emergencyAlertsTable).values({
      farmerId, type, message, lat: lat ?? null, lng: lng ?? null, isResolved: false,
    }).returning();
    const [farmer] = await db.select({ name: farmersTable.name }).from(farmersTable).where(eq(farmersTable.id, farmerId));
    res.status(201).json({ ...alert, farmerName: farmer?.name ?? "Unknown", createdAt: alert.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create emergency alert" });
  }
});

router.patch("/alerts/emergency/:id/resolve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [alert] = await db.update(emergencyAlertsTable)
      .set({ isResolved: true })
      .where(eq(emergencyAlertsTable.id, id))
      .returning();
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    const [farmer] = await db.select({ name: farmersTable.name }).from(farmersTable).where(eq(farmersTable.id, alert.farmerId));
    res.json({ ...alert, farmerName: farmer?.name ?? "Unknown", createdAt: alert.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
});

export default router;
