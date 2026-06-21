import { Router } from "express";
import { db } from "@workspace/db";
import {
  farmersTable,
  locationsTable,
  lightningAlertsTable,
  emergencyAlertsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

interface TimelineEvent {
  id: string;
  type: "emergency" | "lightning_alert" | "location_update" | "registration";
  title: string;
  description: string;
  timestamp: string;
  farmerId: number;
  farmerName: string;
  district: string;
  severity: string | null;
}

router.get("/timeline", async (req, res) => {
  try {
    const farmerIdParam = req.query.farmerId;
    const farmerIdFilter = farmerIdParam ? parseInt(farmerIdParam as string, 10) : null;

    const farmerWhere = farmerIdFilter
      ? eq(farmersTable.id, farmerIdFilter)
      : undefined;

    const farmers = await db
      .select({
        id: farmersTable.id,
        name: farmersTable.name,
        district: farmersTable.district,
        village: farmersTable.village,
        registeredAt: farmersTable.registeredAt,
      })
      .from(farmersTable)
      .where(farmerWhere)
      .orderBy(farmersTable.name);

    if (farmers.length === 0) {
      res.json([]);
      return;
    }

    const farmerIds = farmers.map(f => f.id);
    const farmerMap = new Map(farmers.map(f => [f.id, f]));
    const districtSet = new Set(farmers.map(f => f.district));

    const events: TimelineEvent[] = [];

    // ── Registration events ────────────────────────────────────────────────
    for (const f of farmers) {
      events.push({
        id: `registration-${f.id}`,
        type: "registration",
        title: "Farmer registered",
        description: `${f.name} registered in ${f.village}, ${f.district}.`,
        timestamp: f.registeredAt.toISOString(),
        farmerId: f.id,
        farmerName: f.name,
        district: f.district,
        severity: null,
      });
    }

    // ── Emergency alerts (per farmer) ──────────────────────────────────────
    const emergencies = await db
      .select({
        id: emergencyAlertsTable.id,
        farmerId: emergencyAlertsTable.farmerId,
        type: emergencyAlertsTable.type,
        message: emergencyAlertsTable.message,
        isResolved: emergencyAlertsTable.isResolved,
        createdAt: emergencyAlertsTable.createdAt,
      })
      .from(emergencyAlertsTable)
      .where(
        farmerIdFilter
          ? eq(emergencyAlertsTable.farmerId, farmerIdFilter)
          : sql`${emergencyAlertsTable.farmerId} = ANY(${sql.raw(`ARRAY[${farmerIds.join(",")}]::int[]`)})`
      )
      .orderBy(desc(emergencyAlertsTable.createdAt));

    for (const e of emergencies) {
      const farmer = farmerMap.get(e.farmerId);
      if (!farmer) continue;
      const typeLabel = e.type === "lightning_strike" ? "Lightning Strike" : e.type === "medical" ? "Medical Emergency" : e.type === "missing" ? "Missing Person" : "Emergency";
      events.push({
        id: `emergency-${e.id}`,
        type: "emergency",
        title: e.isResolved ? `${typeLabel} resolved` : `${typeLabel} reported`,
        description: e.message,
        timestamp: e.createdAt.toISOString(),
        farmerId: e.farmerId,
        farmerName: farmer.name,
        district: farmer.district,
        severity: e.isResolved ? "low" : "critical",
      });
    }

    // ── Location updates (latest 5 per farmer to keep it lightweight) ──────
    for (const farmer of farmers) {
      const locs = await db
        .select({
          id: locationsTable.id,
          lat: locationsTable.lat,
          lng: locationsTable.lng,
          recordedAt: locationsTable.recordedAt,
        })
        .from(locationsTable)
        .where(eq(locationsTable.farmerId, farmer.id))
        .orderBy(desc(locationsTable.recordedAt))
        .limit(5);

      for (const loc of locs) {
        events.push({
          id: `location-${loc.id}`,
          type: "location_update",
          title: "Location recorded",
          description: `GPS position updated — ${loc.lat.toFixed(4)}°N, ${loc.lng.toFixed(4)}°E`,
          timestamp: loc.recordedAt.toISOString(),
          farmerId: farmer.id,
          farmerName: farmer.name,
          district: farmer.district,
          severity: null,
        });
      }
    }

    // ── Lightning alerts (district-level, matched to farmers) ─────────────
    const districts = Array.from(districtSet);
    const lightningAlerts = await db
      .select({
        id: lightningAlertsTable.id,
        district: lightningAlertsTable.district,
        severity: lightningAlertsTable.severity,
        message: lightningAlertsTable.message,
        isActive: lightningAlertsTable.isActive,
        createdAt: lightningAlertsTable.createdAt,
      })
      .from(lightningAlertsTable)
      .where(
        sql`${lightningAlertsTable.district} = ANY(${sql.raw(`ARRAY[${districts.map(d => `'${d.replace(/'/g, "''")}'`).join(",")}]::text[]`)})`
      )
      .orderBy(desc(lightningAlertsTable.createdAt));

    // For each lightning alert, attach it to all farmers in that district
    for (const alert of lightningAlerts) {
      const affectedFarmers = farmers.filter(f => f.district === alert.district);
      for (const farmer of affectedFarmers) {
        events.push({
          id: `lightning-${alert.id}-farmer-${farmer.id}`,
          type: "lightning_alert",
          title: `Lightning alert — ${alert.severity.toUpperCase()}`,
          description: alert.message,
          timestamp: alert.createdAt.toISOString(),
          farmerId: farmer.id,
          farmerName: farmer.name,
          district: alert.district,
          severity: alert.severity,
        });
      }
    }

    // Sort all events newest first
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(events);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

export default router;
