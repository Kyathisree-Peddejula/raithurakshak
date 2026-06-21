import { Router } from "express";
import { db } from "@workspace/db";
import {
  farmersTable,
  locationsTable,
  lightningAlertsTable,
  emergencyAlertsTable,
  weatherDataTable,
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) return "safe";
  if (score <= 40) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

interface ScoreResult {
  score: number;
  reasons: string[];
  actions: string[];
  actionsTe: string[];
}

function computeRisk(opts: {
  farmerName: string;
  district: string;
  weather: { lightningRisk: string; windSpeed: number; condition: string } | null;
  activeAlertSeverity: string | null;
  hasActiveEmergency: boolean;
  lastLocationAt: Date | null;
  isActive: boolean;
}): ScoreResult {
  const { farmerName, district, weather, activeAlertSeverity, hasActiveEmergency, lastLocationAt, isActive } = opts;

  if (!isActive) {
    return {
      score: 0,
      reasons: ["Farmer is marked as inactive — not currently in the field."],
      actions: ["No action required. Farmer is not registered as active."],
    };
  }

  let score = 0;
  const reasons: string[] = [];
  const actions: string[] = [];

  // ── Factor 1: District lightning risk from weather data ────────────────────
  if (weather) {
    const riskScores: Record<string, number> = { critical: 40, high: 25, medium: 10, low: 5 };
    const riskLabels: Record<string, string> = {
      critical: `Severe lightning risk in ${district} district (weather risk: CRITICAL)`,
      high: `High lightning activity reported in ${district} district`,
      medium: `Moderate lightning conditions in ${district} district`,
      low: `Low lightning risk in ${district} district`,
    };
    const pts = riskScores[weather.lightningRisk] ?? 0;
    if (pts > 0) {
      score += pts;
      reasons.push(riskLabels[weather.lightningRisk] ?? `Lightning risk: ${weather.lightningRisk}`);
    }

    // ── Factor 2: Wind speed from weather ─────────────────────────────────────
    if (weather.windSpeed > 40) {
      score += 10;
      reasons.push(`Dangerously high wind speeds (${weather.windSpeed} km/h) — storm conditions`);
    } else if (weather.windSpeed > 25) {
      score += 5;
      reasons.push(`Elevated wind speeds (${weather.windSpeed} km/h) — storm conditions possible`);
    }

    // ── Factor 3: Weather condition string ────────────────────────────────────
    const cond = weather.condition.toLowerCase();
    if (cond.includes("severe thunderstorm")) {
      score += 15;
      reasons.push(`Severe thunderstorm active in ${district}: "${weather.condition}"`);
    } else if (cond.includes("thunderstorm")) {
      score += 10;
      reasons.push(`Thunderstorm reported in ${district}: "${weather.condition}"`);
    } else if (cond.includes("heavy rain")) {
      score += 5;
      reasons.push(`Heavy rain in ${district} increases strike risk`);
    }
  } else {
    score += 5;
    reasons.push(`No weather data available for ${district} — risk cannot be assessed accurately`);
  }

  // ── Factor 4: Active lightning alert in farmer's district ─────────────────
  if (activeAlertSeverity) {
    const alertScores: Record<string, number> = { critical: 20, high: 15, medium: 8, low: 3 };
    const alertLabels: Record<string, string> = {
      critical: `Active CRITICAL lightning alert officially issued for ${district}`,
      high: `Active HIGH severity alert issued by district officers for ${district}`,
      medium: `Active MEDIUM severity lightning alert in effect for ${district}`,
      low: `Active LOW severity lightning advisory in effect for ${district}`,
    };
    const pts = alertScores[activeAlertSeverity] ?? 0;
    score += pts;
    reasons.push(alertLabels[activeAlertSeverity] ?? `Active alert: ${activeAlertSeverity}`);
  }

  // ── Factor 5: Active unresolved emergency for this farmer ─────────────────
  if (hasActiveEmergency) {
    score += 25;
    reasons.push(`${farmerName} has an active, unresolved emergency on record`);
  }

  // ── Factor 6: Time since last location update ────────────────────────────
  const now = Date.now();
  if (!lastLocationAt) {
    score += 15;
    reasons.push("No GPS location on record — farmer is untracked and cannot be located");
  } else {
    const hoursAgo = (now - lastLocationAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 6) {
      score += 15;
      reasons.push(`Last known location is over ${Math.floor(hoursAgo)} hours old — farmer may have moved to a different zone`);
    } else if (hoursAgo > 2) {
      score += 10;
      reasons.push(`Last known location is ${Math.floor(hoursAgo)} hours old — location may be outdated`);
    } else if (hoursAgo > 1) {
      score += 5;
      reasons.push(`Last known location is ${Math.round(hoursAgo * 60)} minutes old`);
    }
  }

  const finalScore = Math.min(100, score);
  const level = getRiskLevel(finalScore);

  // ── Generate recommended actions (English + Telugu) ───────────────────────
  const actionsTe: string[] = [];

  if (level === "safe") {
    actions.push("No immediate action required.");
    actions.push("Continue routine monitoring.");
    actionsTe.push("ఇప్పుడు ఎటువంటి చర్య అవసరం లేదు.");
    actionsTe.push("సాధారణ నిఘాను కొనసాగించండి.");
  } else if (level === "low") {
    actions.push(`Notify ${farmerName}'s family to stay alert.`);
    actions.push("Check district weather updates every 2 hours.");
    actions.push("Remind farmer to seek shelter if conditions worsen.");
    actionsTe.push(`${farmerName} కుటుంబానికి అప్రమత్తంగా ఉండమని తెలియజేయండి.`);
    actionsTe.push("ప్రతి 2 గంటలకు జిల్లా వాతావరణ నవీకరణలను తనిఖీ చేయండి.");
    actionsTe.push("పరిస్థితులు తీవ్రమైతే రైతును సురక్షిత ప్రదేశానికి వెళ్లమని గుర్తు చేయండి.");
  } else if (level === "medium") {
    actions.push(`Call ${farmerName} immediately to verify their safety.`);
    actions.push("Advise farmer to move away from open fields and tall trees.");
    actions.push("Notify family members to expect a check-in call.");
    actions.push("Update farmer's GPS location.");
    actionsTe.push(`${farmerName}కి వెంటనే ఫోన్ చేసి వారి సురక్షితత నిర్ధారించండి.`);
    actionsTe.push("రైతును బహిరంగ పొలాలు మరియు పెద్ద చెట్ల నుండి దూరంగా వెళ్లమని సూచించండి.");
    actionsTe.push("కుటుంబ సభ్యులకు ఫోన్ వస్తుందని తెలియజేయండి.");
    actionsTe.push("రైతు GPS స్థానాన్ని నవీకరించండి.");
  } else if (level === "high") {
    actions.push(`⚠️ Urgently contact ${farmerName} and confirm their location.`);
    actions.push("Instruct farmer to seek permanent shelter — do NOT remain in open fields.");
    actions.push("Alert family members and ask them to reach out directly.");
    actions.push("Log a safety check-in in the emergency system.");
    actions.push("Dispatch field officer to last known location if unreachable.");
    actionsTe.push(`⚠️ ${farmerName}ని తక్షణమే సంప్రదించి స్థానాన్ని నిర్ధారించండి.`);
    actionsTe.push("పిడుగుల ప్రమాదం ఉంది. వెంటనే సురక్షిత ప్రదేశానికి వెళ్లండి — బహిరంగ పొలాలలో ఉండవద్దు.");
    actionsTe.push("కుటుంబ సభ్యులను అప్రమత్తం చేయండి, వారు నేరుగా సంప్రదించమని కోరండి.");
    actionsTe.push("అత్యవసర వ్యవస్థలో సురక్షిత తనిఖీని నమోదు చేయండి.");
    actionsTe.push("అందుబాటులో లేకుంటే చివరి తెలిసిన స్థానానికి క్షేత్ర అధికారిని పంపండి.");
  } else {
    actions.push(`🚨 IMMEDIATE ACTION: Attempt to reach ${farmerName} by phone now.`);
    actions.push("Dispatch emergency response team to last known GPS location.");
    actions.push("Notify family members and ask them to go to the field.");
    actions.push("File a pre-emptive emergency alert in the system.");
    actions.push("Contact local hospital and alert them to standby.");
    actions.push("Coordinate with district emergency control room.");
    actionsTe.push(`🚨 తక్షణ చర్య: ఇప్పుడే ${farmerName}కి ఫోన్ చేయండి.`);
    actionsTe.push("చివరి తెలిసిన GPS స్థానానికి అత్యవసర స్పందన బృందాన్ని పంపండి.");
    actionsTe.push("కుటుంబ సభ్యులను తెలియజేయండి మరియు పొలానికి వెళ్లమని కోరండి.");
    actionsTe.push("వ్యవస్థలో అత్యవసర హెచ్చరికను నమోదు చేయండి.");
    actionsTe.push("స్థానిక ఆసుపత్రిని సంప్రదించి సిద్ధంగా ఉండమని తెలియజేయండి.");
    actionsTe.push("జిల్లా అత్యవసర నియంత్రణ గదితో సమన్వయం చేసుకోండి.");
  }

  return { score: finalScore, reasons, actions, actionsTe };
}

async function buildRiskForFarmer(farmer: {
  id: number;
  name: string;
  district: string;
  village: string;
  isActive: boolean;
}) {
  const [weather] = await db
    .select()
    .from(weatherDataTable)
    .where(eq(weatherDataTable.district, farmer.district))
    .limit(1);

  const alertRows = await db
    .select({ severity: lightningAlertsTable.severity })
    .from(lightningAlertsTable)
    .where(
      and(
        eq(lightningAlertsTable.district, farmer.district),
        eq(lightningAlertsTable.isActive, true)
      )
    )
    .orderBy(
      sql`CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END`
    )
    .limit(1);

  const emergencyRows = await db
    .select({ id: emergencyAlertsTable.id })
    .from(emergencyAlertsTable)
    .where(
      and(
        eq(emergencyAlertsTable.farmerId, farmer.id),
        eq(emergencyAlertsTable.isResolved, false)
      )
    )
    .limit(1);

  const locationRows = await db
    .select({ recordedAt: locationsTable.recordedAt })
    .from(locationsTable)
    .where(eq(locationsTable.farmerId, farmer.id))
    .orderBy(desc(locationsTable.recordedAt))
    .limit(1);

  const result = computeRisk({
    farmerName: farmer.name,
    district: farmer.district,
    weather: weather
      ? {
          lightningRisk: weather.lightningRisk,
          windSpeed: weather.windSpeed,
          condition: weather.condition,
        }
      : null,
    activeAlertSeverity: alertRows[0]?.severity ?? null,
    hasActiveEmergency: emergencyRows.length > 0,
    lastLocationAt: locationRows[0]?.recordedAt ?? null,
    isActive: farmer.isActive,
  });

  return {
    farmerId: farmer.id,
    farmerName: farmer.name,
    district: farmer.district,
    village: farmer.village,
    score: result.score,
    riskLevel: getRiskLevel(result.score),
    reasons: result.reasons,
    actions: result.actions,
    actionsTe: result.actionsTe,
    lastLocationAt: locationRows[0]?.recordedAt?.toISOString() ?? null,
    computedAt: new Date().toISOString(),
  };
}

router.get("/risk", async (req, res) => {
  try {
    const farmers = await db
      .select({
        id: farmersTable.id,
        name: farmersTable.name,
        district: farmersTable.district,
        village: farmersTable.village,
        isActive: farmersTable.isActive,
      })
      .from(farmersTable)
      .orderBy(farmersTable.name);

    const assessments = await Promise.all(farmers.map(buildRiskForFarmer));

    assessments.sort((a, b) => b.score - a.score);

    res.json(assessments);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to compute risk assessments" });
  }
});

router.get("/risk/:farmerId", async (req, res) => {
  try {
    const farmerId = parseInt(req.params.farmerId, 10);
    if (isNaN(farmerId)) {
      res.status(400).json({ error: "Invalid farmer ID" });
      return;
    }

    const [farmer] = await db
      .select({
        id: farmersTable.id,
        name: farmersTable.name,
        district: farmersTable.district,
        village: farmersTable.village,
        isActive: farmersTable.isActive,
      })
      .from(farmersTable)
      .where(eq(farmersTable.id, farmerId))
      .limit(1);

    if (!farmer) {
      res.status(404).json({ error: "Farmer not found" });
      return;
    }

    const assessment = await buildRiskForFarmer(farmer);
    res.json(assessment);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to compute risk assessment" });
  }
});

export default router;
