/**
 * RiskEngine.tsx — Lightning Emergency Probability Engine (Enhanced)
 *
 * Backend scoring logic is unchanged.  All improvements are purely presentational:
 *   • Per-factor score breakdown bars (6 factors with exact pts/max)
 *   • Confidence level badge (High / Medium / Low) with bilingual explanation
 *   • Fully bilingual — every label has an English and Telugu version
 *   • Visual stacked score chart + factor contribution tooltips
 *   • Improved FamilyRescuePanel with always-visible reasons
 *   • Enhanced "How Scores Are Computed" footer
 */

import { useState } from "react";
import { useGetFarmerRiskAssessments } from "@workspace/api-client-react";
import type { FamilyRecommendation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info,
  Users, Phone, MapPin, Wind, Cloud, Radio, Navigation,
  ShieldCheck, ShieldAlert, BarChart3, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useLang, teluguRiskMessages } from "@/context/LanguageContext";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Risk level display config
// ─────────────────────────────────────────────────────────────────────────────

type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

const riskConfig: Record<RiskLevel, {
  label: string; labelTe: string;
  color: string; bg: string; border: string; bar: string; icon: string;
}> = {
  safe:     { label: "Safe",        labelTe: "సురక్షితం",       color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", bar: "bg-green-500",  icon: "✅" },
  low:      { label: "Low Risk",    labelTe: "తక్కువ ప్రమాదం",  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  bar: "bg-blue-500",   icon: "🔵" },
  medium:   { label: "Medium Risk", labelTe: "మధ్యస్థ ప్రమాదం", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200", bar: "bg-yellow-500", icon: "⚠️" },
  high:     { label: "High Risk",   labelTe: "అధిక ప్రమాదం",    color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", bar: "bg-orange-500", icon: "🔶" },
  critical: { label: "Critical",    labelTe: "విపత్కరం",         color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",   bar: "bg-red-600",    icon: "🚨" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Factor metadata — mirrors backend weights exactly (no backend changes needed)
// Max raw score = 40 + 10 + 15 + 20 + 25 + 15 = 125; capped to 100.
// ─────────────────────────────────────────────────────────────────────────────

interface FactorMeta {
  nameEn: string; nameTe: string;
  maxPts: number;
  Icon: LucideIcon;
  barColor: string; iconColor: string; textColor: string; dimColor: string;
}

const FACTORS: Record<string, FactorMeta> = {
  weather: {
    nameEn: "Lightning Risk (Weather)", nameTe: "పిడుగుల ప్రమాదం (వాతావరణం)",
    maxPts: 40, Icon: Zap,
    barColor: "bg-red-500", iconColor: "text-red-500", textColor: "text-red-700", dimColor: "text-red-300",
  },
  wind: {
    nameEn: "Wind Speed", nameTe: "గాలి వేగం",
    maxPts: 10, Icon: Wind,
    barColor: "bg-sky-500", iconColor: "text-sky-500", textColor: "text-sky-700", dimColor: "text-sky-300",
  },
  storm: {
    nameEn: "Storm Conditions", nameTe: "తుఫాన్ పరిస్థితులు",
    maxPts: 15, Icon: Cloud,
    barColor: "bg-violet-500", iconColor: "text-violet-500", textColor: "text-violet-700", dimColor: "text-violet-300",
  },
  alert: {
    nameEn: "Active District Alert", nameTe: "సక్రియ జిల్లా హెచ్చరిక",
    maxPts: 20, Icon: Radio,
    barColor: "bg-orange-500", iconColor: "text-orange-500", textColor: "text-orange-700", dimColor: "text-orange-300",
  },
  emergency: {
    nameEn: "Emergency Record", nameTe: "అత్యవసర రికార్డు",
    maxPts: 25, Icon: AlertTriangle,
    barColor: "bg-rose-600", iconColor: "text-rose-600", textColor: "text-rose-800", dimColor: "text-rose-300",
  },
  gps: {
    nameEn: "GPS Freshness", nameTe: "GPS తాజాదనం",
    maxPts: 15, Icon: Navigation,
    barColor: "bg-amber-500", iconColor: "text-amber-500", textColor: "text-amber-700", dimColor: "text-amber-300",
  },
};

const FACTOR_ORDER = ["weather", "wind", "storm", "alert", "emergency", "gps"] as const;

interface ParsedFactor {
  id: string;
  pts: number;
  detailEn: string;
  detailTe: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse backend reasons[] → per-factor point contributions (pure, no API call)
// ─────────────────────────────────────────────────────────────────────────────

function parseFactors(reasons: string[]): ParsedFactor[] {
  // Inactive farmers have score 0 and a single "inactive" reason
  if (reasons.some(r => r.includes("marked as inactive"))) {
    return FACTOR_ORDER.map(id => ({ id, pts: 0, detailEn: "Farmer is inactive.", detailTe: "రైతు నిష్క్రియంగా ఉన్నారు." }));
  }

  const has = (needle: string) => reasons.some(r => r.includes(needle));
  const hasIn = (needle1: string, needle2: string) =>
    reasons.some(r => r.includes(needle1) && r.includes(needle2));

  // ── Factor 1: District lightning risk from weather ─────────────────────────
  let weatherPts = 0;
  let weatherEn = "No severe weather detected.";
  let weatherTe = "తీవ్రమైన వాతావరణం గుర్తించబడలేదు.";
  if (has("weather risk: CRITICAL")) {
    weatherPts = 40;
    weatherEn = "Severe lightning risk — CRITICAL level district weather.";
    weatherTe = "తీవ్రమైన పిడుగుల ప్రమాదం — జిల్లాలో CRITICAL స్థాయి వాతావరణం.";
  } else if (has("High lightning activity reported")) {
    weatherPts = 25;
    weatherEn = "High lightning activity reported in district weather.";
    weatherTe = "జిల్లా వాతావరణంలో అధిక పిడుగుల కార్యకలాపాలు నివేదించబడ్డాయి.";
  } else if (has("Moderate lightning conditions")) {
    weatherPts = 10;
    weatherEn = "Moderate lightning conditions in district.";
    weatherTe = "జిల్లాలో మితమైన పిడుగుల పరిస్థితులు.";
  } else if (has("Low lightning risk in")) {
    weatherPts = 5;
    weatherEn = "Low lightning risk detected in district weather.";
    weatherTe = "జిల్లా వాతావరణంలో తక్కువ పిడుగుల ప్రమాదం.";
  } else if (has("No weather data available")) {
    weatherPts = 5;
    weatherEn = "No live weather data — baseline uncertainty penalty applied.";
    weatherTe = "తాజా వాతావరణ డేటా లేదు — బేస్‌లైన్ అనిశ్చితత పెనాల్టీ వర్తించబడింది.";
  }

  // ── Factor 2: Wind speed ───────────────────────────────────────────────────
  let windPts = 0;
  let windEn = "Wind speed within safe limits.";
  let windTe = "గాలి వేగం సురక్షిత పరిమితుల్లో ఉంది.";
  if (has("Dangerously high wind speeds")) {
    windPts = 10;
    windEn = "Dangerously high wind speed (>40 km/h) — storm conditions present.";
    windTe = "ప్రమాదకరమైన అధిక గాలి వేగం (>40 km/h) — తుఫాన్ పరిస్థితులు ఉన్నాయి.";
  } else if (has("Elevated wind speeds")) {
    windPts = 5;
    windEn = "Elevated wind speed (>25 km/h) — storm conditions possible.";
    windTe = "పెరిగిన గాలి వేగం (>25 km/h) — తుఫాన్ పరిస్థితులు సాధ్యమే.";
  }

  // ── Factor 3: Storm / weather condition string ─────────────────────────────
  let stormPts = 0;
  let stormEn = "No active storm or heavy rain reported.";
  let stormTe = "సక్రియ తుఫాన్ లేదా భారీ వర్షం నివేదించబడలేదు.";
  if (has("Severe thunderstorm")) {
    stormPts = 15;
    stormEn = "Severe thunderstorm actively occurring in district.";
    stormTe = "జిల్లాలో తీవ్రమైన పిడుగుల తుఫాన్ సంభవిస్తోంది.";
  } else if (has("Thunderstorm reported in")) {
    stormPts = 10;
    stormEn = "Thunderstorm reported in district weather conditions.";
    stormTe = "జిల్లా వాతావరణ పరిస్థితులలో పిడుగుల తుఫాన్ నివేదించబడింది.";
  } else if (has("Heavy rain in")) {
    stormPts = 5;
    stormEn = "Heavy rain increases lightning strike probability.";
    stormTe = "భారీ వర్షం పిడుగుల సంభావ్యతను పెంచుతుంది.";
  }

  // ── Factor 4: Active official lightning alert ──────────────────────────────
  let alertPts = 0;
  let alertEn = "No active lightning alert for this district.";
  let alertTe = "ఈ జిల్లాకు సక్రియ పిడుగుల హెచ్చరిక లేదు.";
  if (has("Active CRITICAL lightning alert")) {
    alertPts = 20;
    alertEn = "CRITICAL lightning alert officially issued by district officers.";
    alertTe = "జిల్లా అధికారులచే CRITICAL పిడుగుల హెచ్చరిక అధికారికంగా జారీ.";
  } else if (has("Active HIGH severity alert")) {
    alertPts = 15;
    alertEn = "HIGH severity lightning alert issued by district officers.";
    alertTe = "జిల్లా అధికారులచే HIGH తీవ్రత పిడుగుల హెచ్చరిక జారీ.";
  } else if (has("Active MEDIUM severity lightning")) {
    alertPts = 8;
    alertEn = "MEDIUM severity lightning alert in effect for district.";
    alertTe = "జిల్లాకు MEDIUM తీవ్రత పిడుగుల హెచ్చరిక అమలులో ఉంది.";
  } else if (has("Active LOW severity lightning")) {
    alertPts = 3;
    alertEn = "LOW severity lightning advisory in effect for district.";
    alertTe = "జిల్లాకు LOW తీవ్రత పిడుగుల సలహా అమలులో ఉంది.";
  }

  // ── Factor 5: Active unresolved emergency ─────────────────────────────────
  let emergencyPts = 0;
  let emergencyEn = "No active emergency on record for this farmer.";
  let emergencyTe = "ఈ రైతుకు రికార్డులో సక్రియ అత్యవసర స్థితి లేదు.";
  if (has("unresolved emergency on record") || has("active, unresolved emergency")) {
    emergencyPts = 25;
    emergencyEn = "Farmer has an active, unresolved emergency on record.";
    emergencyTe = "రైతుకు రికార్డులో సక్రియ, పరిష్కరించబడని అత్యవసర స్థితి ఉంది.";
  }

  // ── Factor 6: GPS location freshness ──────────────────────────────────────
  let gpsPts = 0;
  let gpsEn = "GPS location is current — farmer's position is known.";
  let gpsTe = "GPS స్థానం తాజాగా ఉంది — రైతు స్థానం తెలిసింది.";
  if (has("No GPS location on record")) {
    gpsPts = 15;
    gpsEn = "No GPS location on record — farmer is completely untracked.";
    gpsTe = "రికార్డులో GPS స్థానం లేదు — రైతు పూర్తిగా ట్రాక్ చేయబడలేదు.";
  } else if (hasIn("hours old", "over ")) {
    gpsPts = 15;
    gpsEn = "GPS location is over 6 hours old — position is highly stale.";
    gpsTe = "GPS స్థానం 6 గంటలకు పైగా పాతది — స్థానం చాలా నిరుపయోగంగా ఉంది.";
  } else if (has("hours old")) {
    gpsPts = 10;
    gpsEn = "GPS location is 2–6 hours old — may not reflect current position.";
    gpsTe = "GPS స్థానం 2–6 గంటలు పాతది — ప్రస్తుత స్థానాన్ని ప్రతిబింబించకపోవచ్చు.";
  } else if (has("minutes old")) {
    gpsPts = 5;
    gpsEn = "GPS location is 1–2 hours old — slightly outdated.";
    gpsTe = "GPS స్థానం 1–2 గంటలు పాతది — కొద్దిగా నిరుపయోగంగా ఉంది.";
  }

  return [
    { id: "weather",   pts: weatherPts,   detailEn: weatherEn,   detailTe: weatherTe },
    { id: "wind",      pts: windPts,       detailEn: windEn,      detailTe: windTe },
    { id: "storm",     pts: stormPts,      detailEn: stormEn,     detailTe: stormTe },
    { id: "alert",     pts: alertPts,      detailEn: alertEn,     detailTe: alertTe },
    { id: "emergency", pts: emergencyPts,  detailEn: emergencyEn, detailTe: emergencyTe },
    { id: "gps",       pts: gpsPts,        detailEn: gpsEn,       detailTe: gpsTe },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence level — derived from data availability
// ─────────────────────────────────────────────────────────────────────────────

interface ConfidenceInfo {
  level: "high" | "medium" | "low";
  labelEn: string; labelTe: string;
  reasonEn: string; reasonTe: string;
  cls: string;      // combined badge classes
  Icon: LucideIcon;
}

function computeConfidence(reasons: string[], lastLocationAt?: string | null): ConfidenceInfo {
  const noWeather    = reasons.some(r => r.includes("No weather data available"));
  const noGPS        = reasons.some(r => r.includes("No GPS location on record"));
  const gpsStale6h   = reasons.some(r => r.includes("hours old") && r.includes("over "));
  const gpsStale2to6 = reasons.some(r => r.includes("hours old") && !r.includes("over "));
  const gpsStale1to2 = reasons.some(r => r.includes("minutes old"));

  const hasWeather = !noWeather;
  const gpsAge = lastLocationAt
    ? (Date.now() - new Date(lastLocationAt).getTime()) / 3_600_000
    : Infinity;

  if (hasWeather && gpsAge < 2 && !noGPS) {
    return {
      level: "high",
      labelEn: "High Confidence",  labelTe: "అధిక నమ్మకం",
      reasonEn: "Live weather data and recent GPS location — all inputs are current and reliable.",
      reasonTe: "తాజా వాతావరణ డేటా మరియు ఇటీవలి GPS స్థానం — అన్ని ఇన్‌పుట్‌లు తాజావి మరియు నమ్మదగినవి.",
      cls: "text-green-800 bg-green-50 border-green-300",
      Icon: ShieldCheck,
    };
  }
  if (hasWeather && !noGPS && gpsAge < 6) {
    return {
      level: "medium",
      labelEn: "Medium Confidence", labelTe: "మధ్యస్థ నమ్మకం",
      reasonEn: "Weather data is current, but GPS location is 2–6 hours old — farmer may have moved.",
      reasonTe: "వాతావరణ డేటా తాజాగా ఉంది, కానీ GPS స్థానం 2–6 గంటలు పాతది — రైతు తరలిపోయి ఉండవచ్చు.",
      cls: "text-yellow-800 bg-yellow-50 border-yellow-300",
      Icon: Info,
    };
  }
  if (hasWeather && (noGPS || gpsAge >= 6)) {
    return {
      level: "medium",
      labelEn: "Medium Confidence", labelTe: "మధ్యస్థ నమ్మకం",
      reasonEn: noGPS
        ? "Weather data available but no GPS on record — farmer's physical location is unknown."
        : "Weather data available but GPS is over 6 hours stale — farmer's area may have changed.",
      reasonTe: noGPS
        ? "వాతావరణ డేటా అందుబాటులో ఉంది కానీ GPS రికార్డు లేదు — రైతు భౌతిక స్థానం తెలియదు."
        : "వాతావరణ డేటా అందుబాటులో ఉంది కానీ GPS 6 గంటలకు పైగా పాతది — రైతు ప్రాంతం మారి ఉండవచ్చు.",
      cls: "text-yellow-800 bg-yellow-50 border-yellow-300",
      Icon: Info,
    };
  }
  return {
    level: "low",
    labelEn: "Low Confidence",  labelTe: "తక్కువ నమ్మకం",
    reasonEn: "No live weather data — score relies on district alerts and emergency history only.",
    reasonTe: "తాజా వాతావరణ డేటా లేదు — స్కోర్ జిల్లా హెచ్చరికలు మరియు అత్యవసర చరిత్రపై మాత్రమే ఆధారపడింది.",
    cls: "text-orange-800 bg-orange-50 border-orange-300",
    Icon: AlertTriangle,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ScoreRing — unchanged visual
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({ score, level }: { score: number; level: RiskLevel }) {
  const cfg = riskConfig[level];
  const circumference = 2 * Math.PI * 36;
  const dash = (score / 100) * circumference;
  const ringColor: Record<RiskLevel, string> = {
    safe: "#22c55e", low: "#3b82f6", medium: "#eab308", high: "#f97316", critical: "#dc2626",
  };
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="7" />
        <circle
          cx="40" cy="40" r="36" fill="none"
          stroke={ringColor[level]} strokeWidth="7"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl font-bold leading-none", cfg.color)}>{score}</span>
        <span className="text-[10px] text-muted-foreground font-medium">/100</span>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = riskConfig[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", cfg.color, cfg.bg, cfg.border)}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ConfidenceBadge
// ─────────────────────────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence, lang }: { confidence: ConfidenceInfo; lang: string }) {
  const { Icon } = confidence;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5", confidence.cls)}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wide">
            {lang === "te" ? confidence.labelTe : confidence.labelEn}
          </span>
          <span className="text-[10px] font-semibold opacity-60 uppercase">
            {lang === "te" ? "నమ్మకం" : "Prediction Confidence"}
          </span>
        </div>
        <p className="text-xs mt-0.5 leading-snug opacity-90">
          {lang === "te" ? confidence.reasonTe : confidence.reasonEn}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FactorBar — one horizontal bar for a single scoring factor
// ─────────────────────────────────────────────────────────────────────────────

function FactorBar({
  factor, lang, showTooltip, onToggleTooltip,
}: {
  factor: ParsedFactor;
  lang: string;
  showTooltip: boolean;
  onToggleTooltip: () => void;
}) {
  const meta = FACTORS[factor.id];
  const pct = meta.maxPts > 0 ? Math.min(100, (factor.pts / meta.maxPts) * 100) : 0;
  const active = factor.pts > 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {/* Icon + name */}
        <div className="flex items-center gap-1.5 w-44 shrink-0">
          <meta.Icon className={cn("w-3.5 h-3.5 shrink-0", active ? meta.iconColor : "text-muted-foreground/40")} />
          <span className={cn("text-[11px] font-semibold leading-tight truncate", active ? "text-foreground" : "text-muted-foreground")}>
            {lang === "te" ? meta.nameTe : meta.nameEn}
          </span>
        </div>

        {/* Bar track */}
        <div className="flex-1 h-4 bg-muted/60 rounded-full overflow-hidden relative">
          {active && (
            <div
              className={cn("h-full rounded-full transition-all duration-700", meta.barColor, "opacity-85")}
              style={{ width: `${pct}%` }}
            />
          )}
          {/* Tick marks for max quarters */}
          {[25, 50, 75].map(tick => (
            <div
              key={tick}
              className="absolute top-0 bottom-0 w-px bg-background/60"
              style={{ left: `${tick}%` }}
            />
          ))}
        </div>

        {/* Points */}
        <div className="w-16 text-right shrink-0 flex items-center justify-end gap-0.5">
          <span className={cn("text-xs font-bold tabular-nums", active ? meta.textColor : "text-muted-foreground")}>
            +{factor.pts}
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">/{meta.maxPts}</span>
        </div>

        {/* Toggle detail */}
        <button
          onClick={onToggleTooltip}
          className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center shrink-0 transition-colors"
          title={lang === "te" ? "వివరాలు" : "Details"}
        >
          <Info className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* Expanded detail */}
      {showTooltip && (
        <div className={cn(
          "ml-[188px] text-[11px] leading-snug rounded-md px-2.5 py-1.5 border",
          active
            ? `${meta.textColor} bg-white border-current/20`
            : "text-muted-foreground bg-muted/50 border-border"
        )}>
          {lang === "te" ? factor.detailTe : factor.detailEn}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScoreBreakdown — the full 6-factor panel
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBreakdown({ factors, score, lang }: {
  factors: ParsedFactor[];
  score: number;
  lang: string;
}) {
  const [openFactor, setOpenFactor] = useState<string | null>(null);
  const rawTotal = factors.reduce((s, f) => s + f.pts, 0);
  const maxRaw = 125;
  const wasCapped = rawTotal > 100;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">
            {lang === "te" ? "స్కోర్ విభజన" : "Score Breakdown"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            {lang === "te"
              ? `ముడి మొత్తం: ${rawTotal}/${maxRaw}`
              : `Raw total: ${rawTotal}/${maxRaw}`}
          </span>
          {wasCapped && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
              {lang === "te" ? "100కి పరిమితం" : "Capped to 100"}
            </span>
          )}
          <span className="font-bold text-foreground">
            → {score}/100
          </span>
        </div>
      </div>

      {/* Factor bars */}
      <div className="space-y-2.5">
        {factors.map(f => (
          <FactorBar
            key={f.id}
            factor={f}
            lang={lang}
            showTooltip={openFactor === f.id}
            onToggleTooltip={() => setOpenFactor(p => p === f.id ? null : f.id)}
          />
        ))}
      </div>

      {/* Visual total bar */}
      <div className="mt-3.5 pt-3 border-t">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-44 shrink-0">
            {lang === "te" ? "మొత్తం స్కోర్" : "Overall Score"}
          </span>
          <div className="flex-1 h-4 bg-muted/60 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                score >= 81 ? "bg-red-500"
                  : score >= 61 ? "bg-orange-500"
                  : score >= 41 ? "bg-yellow-500"
                  : score >= 21 ? "bg-blue-500"
                  : "bg-green-500"
              )}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="w-16 text-right shrink-0">
            <span className="text-xs font-bold tabular-nums">{score}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
          <div className="w-5 shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FarmerRiskCard — enhanced with breakdown + confidence
// ─────────────────────────────────────────────────────────────────────────────

type Assessment = NonNullable<ReturnType<typeof useGetFarmerRiskAssessments>["data"]>[number];

function FarmerRiskCard({ assessment }: { assessment: Assessment }) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLang();
  const level = assessment.riskLevel as RiskLevel;
  const cfg = riskConfig[level];

  // Derived data — computed once on render, only when expanded
  const factors = expanded ? parseFactors(assessment.reasons) : [];
  const confidence = expanded ? computeConfidence(assessment.reasons, assessment.lastLocationAt) : null;

  const actions = lang === "te" && assessment.actionsTe?.length
    ? assessment.actionsTe
    : assessment.actions;

  return (
    <Card className={cn("transition-all duration-200 border", level === "critical" && "ring-2 ring-red-400")}>
      <CardContent className="p-4">
        {/* ── Top summary row ── */}
        <div className="flex items-start gap-4">
          <ScoreRing score={assessment.score} level={level} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-semibold text-base leading-tight">{assessment.farmerName}</h3>
                <p className="text-sm text-muted-foreground">{assessment.village}, {assessment.district}</p>
              </div>
              <RiskBadge level={level} />
            </div>

            {/* Score bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {lang === "te" ? "ప్రమాద స్కోర్" : "Risk Score"}
                </span>
                <span className="text-xs font-semibold">{assessment.score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", cfg.bar)} style={{ width: `${assessment.score}%` }} />
              </div>
            </div>

            {/* GPS freshness */}
            {assessment.lastLocationAt ? (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {lang === "te" ? "చివరి స్థానం:" : "Last location:"}
                {" "}{formatDistanceToNow(new Date(assessment.lastLocationAt), { addSuffix: true })}
              </p>
            ) : (
              <p className="text-xs text-orange-600 mt-2 font-medium flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                {lang === "te" ? "⚠ GPS రికార్డు లేదు" : "⚠ No location on record"}
              </p>
            )}

            {/* Critical Telugu warning */}
            {level === "critical" && lang === "te" && (
              <p className="mt-2 text-xs font-semibold text-red-700 bg-red-50 rounded px-2 py-1">
                🚨 {teluguRiskMessages.critical}
              </p>
            )}

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {lang === "te"
                ? `${expanded ? "దాచు" : "చూపు"} వివరాలు (${assessment.reasons.length} కారణాలు)`
                : `${expanded ? "Hide" : "Show"} full analysis (${assessment.reasons.length} risk factor${assessment.reasons.length !== 1 ? "s" : ""})`}
            </button>
          </div>
        </div>

        {/* ── Expanded detail panel ── */}
        {expanded && confidence && (
          <div className="mt-4 border-t pt-4 space-y-5">

            {/* 1. Confidence badge */}
            <ConfidenceBadge confidence={confidence} lang={lang} />

            {/* 2. Score breakdown bars */}
            <ScoreBreakdown factors={factors} score={assessment.score} lang={lang} />

            {/* 3. Reasons + Actions grid */}
            <div className="grid md:grid-cols-2 gap-4 pt-1 border-t">
              {/* Why this score */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Info className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold">
                    {lang === "te" ? "ఈ స్కోర్ ఎందుకు?" : "Why this score?"}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {assessment.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-snug">
                      <span className="text-orange-400 mt-0.5 shrink-0 text-[10px]">◆</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended actions */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    {lang === "te" ? "సిఫార్సు చేసిన చర్యలు" : "Recommended Actions"}
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      lang === "te" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {lang === "te" ? "తె" : "EN"}
                    </span>
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Family rescue panel */}
        {assessment.familyRecommendation && (
          <FamilyRescuePanel rec={assessment.familyRecommendation} farmerName={assessment.farmerName} />
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FamilyRescuePanel — improved with visible reasons + better bilingual layout
// ─────────────────────────────────────────────────────────────────────────────

const familyPriorityCfg = {
  medium:   { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-900", badge: "bg-yellow-200 text-yellow-900", Icon: Phone,         label: "Monitor & Contact",  labelTe: "నిఘా & సంప్రదించు" },
  high:     { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-900", badge: "bg-orange-200 text-orange-900", Icon: AlertTriangle,  label: "Verify Safety Now", labelTe: "ఇప్పుడే సురక్షితత నిర్ధారించు" },
  critical: { bg: "bg-red-50",    border: "border-red-400",    text: "text-red-900",    badge: "bg-red-200 text-red-900",       Icon: MapPin,          label: "Go Immediately",    labelTe: "వెంటనే వెళ్లండి" },
} as const;

function FamilyRescuePanel({ rec, farmerName }: { rec: FamilyRecommendation; farmerName: string }) {
  const { lang } = useLang();
  const priority = rec.priority as keyof typeof familyPriorityCfg;
  const cfg = familyPriorityCfg[priority] ?? familyPriorityCfg.medium;
  const { Icon } = cfg;

  return (
    <div className={cn("mt-4 rounded-xl border-2 p-4", cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Users className={cn("w-4 h-4 shrink-0", cfg.text)} />
        <span className={cn("text-xs font-bold uppercase tracking-wide", cfg.text)}>
          {lang === "te" ? "కుటుంబ రక్షణ సిఫార్సు" : "Family Rescue Recommendation"}
        </span>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto", cfg.badge)}>
          {lang === "te" ? rec.urgencyTe : rec.urgency}
        </span>
      </div>

      {/* Recommended action */}
      <div className={cn("flex items-start gap-2 mb-3 rounded-lg px-3 py-2.5", cfg.bg, "border", cfg.border.replace("border-", "border-"))}>
        <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.text)} />
        <p className={cn("text-sm font-semibold leading-snug", cfg.text)}>
          {lang === "te" ? rec.actionTe : rec.action}
        </p>
      </div>

      {/* Reasons — always visible */}
      {rec.reasons.length > 0 && (
        <div>
          <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-70", cfg.text)}>
            {lang === "te" ? "ఎందుకంటే" : "Why this recommendation"}
          </p>
          <ul className="space-y-1">
            {rec.reasons.map((r, i) => (
              <li key={i} className={cn("flex items-start gap-1.5 text-xs leading-snug", cfg.text)}>
                <span className="mt-0.5 shrink-0 opacity-60">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScoreBand + DistributionBar (page-level summary)
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBand({ label, labelTe, range, count, color, lang }: {
  label: string; labelTe: string; range: string; count: number; color: string; lang: string;
}) {
  return (
    <div className={cn("rounded-lg border p-3 text-center", color)}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-semibold mt-0.5">{lang === "te" ? labelTe : label}</div>
      <div className="text-[10px] opacity-70">{range}</div>
    </div>
  );
}

function DistributionBar({ counts, total }: {
  counts: Record<string, number>; total: number;
}) {
  if (total === 0) return null;
  const bands = [
    { key: "critical", color: "bg-red-500" },
    { key: "high",     color: "bg-orange-500" },
    { key: "medium",   color: "bg-yellow-400" },
    { key: "low",      color: "bg-blue-400" },
    { key: "safe",     color: "bg-green-500" },
  ];
  return (
    <div className="h-2 rounded-full overflow-hidden flex gap-px bg-muted">
      {bands.map(b => {
        const pct = (counts[b.key] / total) * 100;
        return pct > 0 ? (
          <div
            key={b.key}
            className={cn("h-full transition-all duration-700", b.color)}
            style={{ width: `${pct}%` }}
            title={`${b.key}: ${counts[b.key]} farmer${counts[b.key] !== 1 ? "s" : ""}`}
          />
        ) : null;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function RiskEngine() {
  const { data: assessments = [], isLoading } = useGetFarmerRiskAssessments();
  const { lang } = useLang();
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  const counts = {
    critical: assessments.filter(a => a.riskLevel === "critical").length,
    high:     assessments.filter(a => a.riskLevel === "high").length,
    medium:   assessments.filter(a => a.riskLevel === "medium").length,
    low:      assessments.filter(a => a.riskLevel === "low").length,
    safe:     assessments.filter(a => a.riskLevel === "safe").length,
  };

  const filtered = filter === "all" ? assessments : assessments.filter(a => a.riskLevel === filter);

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
    : 0;

  const overallLevel: RiskLevel = avgScore <= 20 ? "safe"
    : avgScore <= 40 ? "low"
    : avgScore <= 60 ? "medium"
    : avgScore <= 80 ? "high"
    : "critical";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "te" ? "పిడుగుల అత్యవసర సంభావ్యత ఇంజిన్" : "Lightning Emergency Probability Engine"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "te"
              ? "ప్రతి నమోదిత రైతుకు రియల్-టైమ్ ప్రమాద మూల్యాంకనం."
              : "Real-time explainable danger assessment for every registered farmer."}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <>
          {/* Summary bands */}
          <div className="space-y-2">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <Card className="col-span-1 sm:col-span-1">
                <CardContent className="p-4 flex flex-col items-center gap-1">
                  <ScoreRing score={avgScore} level={overallLevel} />
                  <p className="text-xs font-semibold text-muted-foreground text-center mt-1">
                    {lang === "te" ? "జిల్లా సగటు" : "District Avg"}
                  </p>
                </CardContent>
              </Card>
              <ScoreBand lang={lang} label="Critical" labelTe="విపత్కరం"    range="81–100" count={counts.critical} color="bg-red-50 border-red-200 text-red-700" />
              <ScoreBand lang={lang} label="High Risk" labelTe="అధిక ప్రమాదం" range="61–80" count={counts.high}     color="bg-orange-50 border-orange-200 text-orange-700" />
              <ScoreBand lang={lang} label="Medium"    labelTe="మధ్యస్థ"      range="41–60" count={counts.medium}   color="bg-yellow-50 border-yellow-200 text-yellow-700" />
              <ScoreBand lang={lang} label="Low Risk"  labelTe="తక్కువ ప్రమాదం" range="21–40" count={counts.low}   color="bg-blue-50 border-blue-200 text-blue-700" />
              <ScoreBand lang={lang} label="Safe"      labelTe="సురక్షితం"    range="0–20"  count={counts.safe}     color="bg-green-50 border-green-200 text-green-700" />
            </div>
            {assessments.length > 0 && (
              <DistributionBar counts={counts} total={assessments.length} />
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">
              {lang === "te" ? "ఫిల్టర్:" : "Filter:"}
            </span>
            {(["all", "critical", "high", "medium", "low", "safe"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-muted hover:border-primary/50"
                )}
              >
                {f === "all"
                  ? `${lang === "te" ? "అన్నీ" : "All"} (${assessments.length})`
                  : `${lang === "te" ? riskConfig[f].labelTe : riskConfig[f].label} (${counts[f]})`}
              </button>
            ))}
          </div>

          {/* Farmer cards */}
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                {lang === "te" ? "ఈ ఫిల్టర్‌కు రైతులు కనుగొనబడలేదు." : "No farmers found for this filter."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(a => (
                <FarmerRiskCard key={a.farmerId} assessment={a} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── How Scores Are Computed — enhanced footer ── */}
      <Card className="bg-muted/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            {lang === "te" ? "స్కోర్‌లు ఎలా లెక్కించబడతాయి" : "How Scores Are Computed"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === "te"
              ? "6 స్వతంత్ర సంకేతాల నుండి రా స్కోర్ లెక్కించబడుతుంది, తర్వాత 100కి పరిమితం అవుతుంది."
              : "Raw score is computed from 6 independent signals, then capped to 100. Click ↓ on any farmer card to see their exact breakdown."}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              {
                id: "weather",
                factorEn: "Lightning Risk (Weather)",  factorTe: "పిడుగుల ప్రమాదం (వాతావరణం)",
                ptsEn: "Up to +40 pts",                ptsTe: "గరిష్ట +40 పాయింట్లు",
                noteEn: "Critical district weather = maximum weight",
                noteTe: "విపత్కర జిల్లా వాతావరణం = గరిష్ట బరువు",
              },
              {
                id: "alert",
                factorEn: "Active District Alert",     factorTe: "సక్రియ జిల్లా హెచ్చరిక",
                ptsEn: "Up to +20 pts",                ptsTe: "గరిష్ట +20 పాయింట్లు",
                noteEn: "Officially issued lightning alerts by officers",
                noteTe: "అధికారులచే అధికారికంగా జారీ చేయబడిన హెచ్చరికలు",
              },
              {
                id: "emergency",
                factorEn: "Emergency Record",          factorTe: "అత్యవసర రికార్డు",
                ptsEn: "+25 pts",                      ptsTe: "+25 పాయింట్లు",
                noteEn: "Farmer has an active unresolved emergency",
                noteTe: "రైతుకు సక్రియ పరిష్కరించబడని అత్యవసర స్థితి ఉంది",
              },
              {
                id: "storm",
                factorEn: "Storm Conditions",          factorTe: "తుఫాన్ పరిస్థితులు",
                ptsEn: "Up to +15 pts",                ptsTe: "గరిష్ట +15 పాయింట్లు",
                noteEn: "Thunderstorm / severe weather / heavy rain",
                noteTe: "పిడుగుల తుఫాన్ / తీవ్రమైన వాతావరణం / భారీ వర్షం",
              },
              {
                id: "gps",
                factorEn: "GPS Freshness",             factorTe: "GPS తాజాదనం",
                ptsEn: "Up to +15 pts",                ptsTe: "గరిష్ట +15 పాయింట్లు",
                noteEn: "No GPS or location older than 6 hrs = maximum penalty",
                noteTe: "GPS లేదా 6 గంటల కంటే పాత స్థానం = గరిష్ట పెనాల్టీ",
              },
              {
                id: "wind",
                factorEn: "Wind Speed",                factorTe: "గాలి వేగం",
                ptsEn: "Up to +10 pts",                ptsTe: "గరిష్ట +10 పాయింట్లు",
                noteEn: ">40 km/h = max penalty; >25 km/h = partial",
                noteTe: ">40 km/h = గరిష్ట పెనాల్టీ; >25 km/h = పాక్షిక",
              },
            ].map(f => {
              const meta = FACTORS[f.id];
              return (
                <div key={f.id} className="flex flex-col gap-1 border rounded-lg p-3 bg-background">
                  <div className="flex items-center gap-1.5">
                    <meta.Icon className={cn("w-3.5 h-3.5", meta.iconColor)} />
                    <span className="font-semibold text-xs text-foreground">
                      {lang === "te" ? f.factorTe : f.factorEn}
                    </span>
                  </div>
                  <span className={cn("text-xs font-bold", meta.textColor)}>
                    {lang === "te" ? f.ptsTe : f.ptsEn}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    {lang === "te" ? f.noteTe : f.noteEn}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Score → level mapping */}
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {lang === "te" ? "స్కోర్ పరిధులు" : "Score → Risk Level Mapping"}
            </p>
            <div className="flex flex-wrap gap-2">
              {(["safe", "low", "medium", "high", "critical"] as RiskLevel[]).map(level => {
                const ranges: Record<RiskLevel, string> = {
                  safe: "0–20", low: "21–40", medium: "41–60", high: "61–80", critical: "81–100",
                };
                const c = riskConfig[level];
                return (
                  <div key={level} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold", c.color, c.bg, c.border)}>
                    <span>{c.icon}</span>
                    <span>{lang === "te" ? c.labelTe : c.label}</span>
                    <span className="opacity-60">({ranges[level]})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
