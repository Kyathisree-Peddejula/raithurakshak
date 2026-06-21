import { Router } from "express";
import { db } from "@workspace/db";
import { farmersTable, familyMembersTable, lightningAlertsTable, emergencyAlertsTable, weatherDataTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const [farmerStats] = await db.select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where is_active)::int`,
    }).from(farmersTable);

    const [{ total: totalFamilyMembers }] = await db.select({
      total: sql<number>`count(*)::int`,
    }).from(familyMembersTable);

    const [{ active: activeLightningAlerts }] = await db.select({
      active: sql<number>`count(*) filter (where is_active)::int`,
    }).from(lightningAlertsTable);

    const [{ active: activeEmergencyAlerts }] = await db.select({
      active: sql<number>`count(*) filter (where not is_resolved)::int`,
    }).from(emergencyAlertsTable);

    const [{ critical: criticalDistricts, total: totalDistricts }] = await db.select({
      critical: sql<number>`count(*) filter (where lightning_risk = 'critical' or lightning_risk = 'high')::int`,
      total: sql<number>`count(*)::int`,
    }).from(weatherDataTable);

    res.json({
      totalFarmers: farmerStats?.total ?? 0,
      activeFarmers: farmerStats?.active ?? 0,
      totalFamilyMembers: totalFamilyMembers ?? 0,
      activeLightningAlerts: activeLightningAlerts ?? 0,
      activeEmergencyAlerts: activeEmergencyAlerts ?? 0,
      criticalDistricts: criticalDistricts ?? 0,
      totalDistricts: totalDistricts ?? 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

router.get("/dashboard/recent-alerts", async (req, res) => {
  try {
    const lightning = await db.select({
      id: lightningAlertsTable.id,
      type: sql<string>`'lightning'`,
      title: sql<string>`'Lightning Alert: ' || district`,
      message: lightningAlertsTable.message,
      severity: lightningAlertsTable.severity,
      createdAt: lightningAlertsTable.createdAt,
    }).from(lightningAlertsTable).limit(5);

    const emergency = await db.select({
      id: emergencyAlertsTable.id,
      type: sql<string>`'emergency'`,
      title: sql<string>`'Emergency: ' || type`,
      message: emergencyAlertsTable.message,
      severity: sql<string>`case when is_resolved then 'low' else 'critical' end`,
      createdAt: emergencyAlertsTable.createdAt,
    }).from(emergencyAlertsTable).limit(5);

    const combined = [...lightning, ...emergency]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(a => ({ ...a, createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt }));

    res.json(combined);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get recent alerts" });
  }
});

router.get("/dashboard/district-risk", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        w.district,
        w.lightning_risk as "riskLevel",
        count(distinct f.id)::int as "farmerCount",
        count(distinct la.id)::int as "alertCount"
      FROM weather_data w
      LEFT JOIN farmers f ON f.district = w.district
      LEFT JOIN lightning_alerts la ON la.district = w.district AND la.is_active = true
      GROUP BY w.district, w.lightning_risk
      ORDER BY
        CASE w.lightning_risk
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END
    `);
    res.json(rows.rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get district risk data" });
  }
});

export default router;
