/**
 * EmergencyContactChain
 *
 * Simulated Emergency Response Chain displayed inside the Emergency Alerts page.
 * Auto-triggers for every farmer at Critical risk level.
 * Shows a 5-stage response timeline with live simulation.
 *
 * Stages:
 *   0 · Farmer at Risk      — detection event (completes instantly at t=0)
 *   1 · Family Notified     — completes at t+35s
 *   2 · Village Volunteer   — completes at t+80s
 *   3 · Emergency Officer   — completes at t+130s
 *   4 · Incident Closed     — completes at t+185s
 *
 * When no critical farmers exist, renders a professional Monitoring Mode card.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useGetFarmerRiskAssessments } from "@workspace/api-client-react";
import type { FarmerRisk } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap, Users, MapPin, ShieldAlert, CheckCircle2,
  Clock, Loader2, ChevronDown, ChevronUp,
  Siren, RefreshCw, X, Radio, Phone, User,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addSeconds } from "date-fns";
import type { LucideIcon } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Cumulative seconds from chain trigger at which each stage completes. */
const COMPLETES_AT: number[] = [0, 35, 80, 130, 185];

/** How often (ms) the live clock ticks to advance the simulation. */
const TICK_MS = 5_000;

const VOLUNTEER_NAMES = [
  "Ramu Reddy", "Venkat Rao", "Suresh Kumar", "Anand Naidu",
  "Krishna Murthy", "Bhaskar Rao", "Srinivas Goud", "Narender Reddy",
];
const OFFICER_NAMES = [
  "Sub-Inspector D. Prakash", "Officer K. Krishnamurthy",
  "Inspector Lakshmi Naidu", "Officer Vijay Kumar",
  "Inspector S. Ravindra", "Sub-Inspector P. Rao",
];
const FAMILY_ROLES = ["Son", "Elder Brother", "Daughter", "Wife", "Father", "Uncle"];
const PHONE_PREFIXES = ["9849", "9440", "8886", "7036", "9963", "8978"];

function seededPick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seededPhone(seed: number): string {
  const prefix = seededPick(PHONE_PREFIXES, seed);
  const suffix = String(1000 + (Math.abs(seed * 7919) % 9000));
  return `+91 ${prefix} ${suffix}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type StageStatus = "pending" | "in_progress" | "completed";

interface StageData {
  assignedPerson: string;
  phone: string;
  remarks: string;
}

interface ResponseChain {
  farmerId: number;
  farmerName: string;
  village: string;
  district: string;
  score: number;
  triggeredAt: Date;
  stages: StageData[]; // indexed 0–4, parallel to STAGE_DEFS
  dismissed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static stage definitions (visual + content config per stage index)
// ─────────────────────────────────────────────────────────────────────────────

interface StageDef {
  id: string;
  title: string;
  titleTe: string;
  defaultRole: string;
  Icon: LucideIcon;
  iconDoneBg: string;    // bg when completed
  iconActiveBg: string;  // bg when in_progress
  iconRing: string;      // ring when in_progress
  iconPendingBg: string; // bg when pending
  connectorDone: string; // connector line color when stage is done
  badgeDone: string;     // badge classes when completed (overrides default green for stage 0 & 4)
}

const STAGE_DEFS: StageDef[] = [
  {
    id: "at_risk",
    title: "Farmer at Risk",
    titleTe: "రైతు ప్రమాదంలో",
    defaultRole: "Affected Farmer",
    Icon: Zap,
    iconDoneBg: "bg-red-600",
    iconActiveBg: "bg-red-100",
    iconRing: "ring-red-300",
    iconPendingBg: "bg-gray-100",
    connectorDone: "bg-red-400",
    badgeDone: "bg-red-100 text-red-800 border-red-300",
  },
  {
    id: "family",
    title: "Family Notified",
    titleTe: "కుటుంబానికి నోటిఫై",
    defaultRole: "Primary Contact",
    Icon: Users,
    iconDoneBg: "bg-green-600",
    iconActiveBg: "bg-blue-100",
    iconRing: "ring-blue-300",
    iconPendingBg: "bg-gray-100",
    connectorDone: "bg-green-400",
    badgeDone: "bg-green-100 text-green-800 border-green-300",
  },
  {
    id: "volunteer",
    title: "Village Volunteer",
    titleTe: "గ్రామ వాలంటీర్",
    defaultRole: "Field Responder",
    Icon: MapPin,
    iconDoneBg: "bg-green-600",
    iconActiveBg: "bg-orange-100",
    iconRing: "ring-orange-300",
    iconPendingBg: "bg-gray-100",
    connectorDone: "bg-green-400",
    badgeDone: "bg-green-100 text-green-800 border-green-300",
  },
  {
    id: "officer",
    title: "Emergency Officer",
    titleTe: "అత్యవసర అధికారి",
    defaultRole: "District Emergency Coordinator",
    Icon: ShieldAlert,
    iconDoneBg: "bg-green-600",
    iconActiveBg: "bg-purple-100",
    iconRing: "ring-purple-300",
    iconPendingBg: "bg-gray-100",
    connectorDone: "bg-green-400",
    badgeDone: "bg-green-100 text-green-800 border-green-300",
  },
  {
    id: "closed",
    title: "Incident Closed",
    titleTe: "సంఘటన మూసివేయబడింది",
    defaultRole: "Duty Officer — System",
    Icon: CheckCircle2,
    iconDoneBg: "bg-green-600",
    iconActiveBg: "bg-green-100",
    iconRing: "ring-green-300",
    iconPendingBg: "bg-gray-100",
    connectorDone: "bg-green-400",
    badgeDone: "bg-green-200 text-green-900 border-green-400",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chain builder — deterministic per farmer ID
// ─────────────────────────────────────────────────────────────────────────────

function buildChain(farmer: Pick<FarmerRisk, "farmerId" | "farmerName" | "village" | "district" | "score">, now: Date): ResponseChain {
  const s = farmer.farmerId;
  const familyRole = seededPick(FAMILY_ROLES, s + 3);

  const stages: StageData[] = [
    {
      assignedPerson: farmer.farmerName,
      phone: seededPhone(s + 5),
      remarks: `Critical risk score of ${farmer.score}/100 detected for ${farmer.farmerName}. Emergency response protocol initiated automatically.`,
    },
    {
      assignedPerson: `${farmer.farmerName}'s ${familyRole}`,
      phone: seededPhone(s),
      remarks: "Family contacted via SMS and automated voice call. Instructed to locate farmer and shelter indoors immediately.",
    },
    {
      assignedPerson: seededPick(VOLUNTEER_NAMES, s + 1),
      phone: seededPhone(s + 10),
      remarks: "Nearest trained volunteer dispatched to last known location with first-aid kit, emergency shelter kit, and radio.",
    },
    {
      assignedPerson: seededPick(OFFICER_NAMES, s + 2),
      phone: seededPhone(s + 20),
      remarks: "District emergency officer alerted. 108 ambulance service notified. Rescue team on standby at taluk headquarters.",
    },
    {
      assignedPerson: "Duty Officer (System)",
      phone: "1800-180-1551",
      remarks: "Farmer confirmed safe by volunteer on-site. All units stood down. Incident logged and archived for district records.",
    },
  ];

  return {
    farmerId: farmer.farmerId,
    farmerName: farmer.farmerName,
    village: farmer.village,
    district: farmer.district,
    score: farmer.score,
    triggeredAt: now,
    stages,
    dismissed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Simulation helpers — pure functions of elapsed time
// ─────────────────────────────────────────────────────────────────────────────

function getStatus(stageIndex: number, elapsed: number): StageStatus {
  if (elapsed >= COMPLETES_AT[stageIndex]) return "completed";
  const prev = stageIndex === 0 ? 0 : COMPLETES_AT[stageIndex - 1];
  if (elapsed >= prev) return "in_progress";
  return "pending";
}

function getTimestamps(stageIndex: number, elapsed: number, triggeredAt: Date): { startedAt: Date | null; completedAt: Date | null } {
  const status = getStatus(stageIndex, elapsed);
  if (status === "pending") return { startedAt: null, completedAt: null };
  const prev = stageIndex === 0 ? 0 : COMPLETES_AT[stageIndex - 1];
  return {
    startedAt: addSeconds(triggeredAt, prev),
    completedAt: status === "completed" ? addSeconds(triggeredAt, COMPLETES_AT[stageIndex]) : null,
  };
}

function elapsedSeconds(triggeredAt: Date, now: Date): number {
  return Math.floor((now.getTime() - triggeredAt.getTime()) / 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status, stageDef }: { status: StageStatus; stageDef: StageDef }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="text-[11px] font-semibold gap-1 bg-gray-100 text-gray-500 border-gray-200">
        <Clock className="w-3 h-3" />
        Pending
      </Badge>
    );
  }
  if (status === "in_progress") {
    return (
      <Badge variant="outline" className="text-[11px] font-semibold gap-1 bg-amber-100 text-amber-800 border-amber-300">
        <Loader2 className="w-3 h-3 animate-spin" />
        In Progress
      </Badge>
    );
  }
  // completed
  const label = stageDef.id === "closed" ? "Incident Closed" : stageDef.id === "at_risk" ? "Detected" : "Completed";
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold gap-1", stageDef.badgeDone)}>
      <CheckCircle2 className="w-3 h-3" />
      {label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single stage row
// ─────────────────────────────────────────────────────────────────────────────

interface StageRowProps {
  stageIndex: number;
  data: StageData;
  elapsed: number;
  triggeredAt: Date;
  isLast: boolean;
}

function StageRow({ stageIndex, data, elapsed, triggeredAt, isLast }: StageRowProps) {
  const def = STAGE_DEFS[stageIndex];
  const status = getStatus(stageIndex, elapsed);
  const { startedAt, completedAt } = getTimestamps(stageIndex, elapsed, triggeredAt);

  const isDone    = status === "completed";
  const isActive  = status === "in_progress";
  const isPending = status === "pending";

  const { Icon } = def;

  return (
    <div className="flex gap-3 sm:gap-4">
      {/* ── Left: icon + connector ── */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Circle */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 flex-shrink-0",
            // ring only when active
            isActive && `ring-2 ${def.iconRing} shadow-sm`,
            isDone   && `${def.iconDoneBg} shadow-sm`,
            isActive && def.iconActiveBg,
            isPending && def.iconPendingBg,
          )}
        >
          {isDone
            ? <CheckCircle2 className="w-5 h-5 text-white" />
            : <Icon className={cn("w-5 h-5", isActive ? "text-gray-700" : "text-gray-400")} />
          }
        </div>

        {/* Connector line */}
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 my-1.5 min-h-[28px] rounded-full transition-colors duration-700",
            isDone ? def.connectorDone : "bg-gray-200",
          )} />
        )}
      </div>

      {/* ── Right: content card ── */}
      <div
        className={cn(
          "flex-1 rounded-xl border p-4 transition-all duration-300",
          !isLast && "mb-0",
          isLast ? "mb-0" : "mb-1",
          isDone   && "bg-green-50/50 border-green-200",
          isActive && "bg-white border-amber-300 shadow-md",
          isPending && "bg-gray-50/80 border-gray-200 opacity-50",
          // special styling for stage 0 completed (danger event)
          stageIndex === 0 && isDone && "bg-red-50/40 border-red-200",
        )}
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-bold",
                isDone && stageIndex === 0 ? "text-red-800"
                  : isDone ? "text-green-800"
                  : isActive ? "text-gray-900"
                  : "text-gray-400",
              )}>
                {def.title}
              </span>
              {isActive && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{def.titleTe}</p>
          </div>
          <StatusBadge status={status} stageDef={def} />
        </div>

        {/* Details grid: person / phone / role */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-3 text-xs mb-3",
          isPending && "opacity-40",
        )}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="font-semibold text-foreground truncate">{data.assignedPerson}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="font-mono">{data.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span>{def.defaultRole}</span>
          </div>
        </div>

        {/* Timestamps */}
        {(startedAt || completedAt) && (
          <div className={cn(
            "flex flex-wrap gap-x-5 gap-y-1 mb-2.5 text-[11px]",
            isPending && "opacity-40",
          )}>
            {startedAt && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {stageIndex === 0 ? "Detected" : "Started"}:{" "}
                <span className="font-semibold text-foreground ml-0.5">
                  {format(startedAt, "dd MMM, HH:mm:ss")}
                </span>
              </span>
            )}
            {completedAt && (
              <span className={cn(
                "flex items-center gap-1",
                stageIndex === 0 ? "text-red-700" : "text-green-700",
              )}>
                <CheckCircle2 className="w-3 h-3" />
                {stageIndex === 4 ? "Closed" : "Completed"}:{" "}
                <span className="font-semibold ml-0.5">{format(completedAt, "HH:mm:ss")}</span>
              </span>
            )}
          </div>
        )}

        {/* Remarks — only when active or completed */}
        {(isDone || isActive) && (
          <div className={cn(
            "text-xs text-muted-foreground leading-relaxed border-t pt-2.5",
            stageIndex === 0 && isDone ? "border-red-200" : isDone ? "border-green-200" : "border-gray-200",
          )}>
            <span className="font-semibold text-foreground">Remarks: </span>
            {data.remarks}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Response chain card (one card per critical farmer)
// ─────────────────────────────────────────────────────────────────────────────

interface ChainCardProps {
  chain: ResponseChain;
  now: Date;
  onDismiss: () => void;
  onReset: () => void;
}

function ResponseChainCard({ chain, now, onDismiss, onReset }: ChainCardProps) {
  const [expanded, setExpanded] = useState(true);
  const elapsed = elapsedSeconds(chain.triggeredAt, now);
  const allDone = elapsed >= COMPLETES_AT[COMPLETES_AT.length - 1];

  // Overall progress: fraction of last COMPLETES_AT reached
  const maxTime = COMPLETES_AT[COMPLETES_AT.length - 1];
  const progressPct = Math.min(100, Math.round((elapsed / maxTime) * 100));

  return (
    <Card className={cn(
      "border-2 transition-all duration-500 overflow-hidden",
      allDone ? "border-green-500" : "border-red-400",
    )}>
      {/* ── Header ── */}
      <CardHeader className={cn(
        "pb-3 pt-4 px-5",
        allDone ? "bg-green-50/60" : "bg-red-50/30",
      )}>
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
              allDone ? "bg-green-600" : "bg-red-600",
            )}>
              {allDone
                ? <CheckCircle2 className="w-5 h-5 text-white" />
                : <Siren className="w-5 h-5 text-white animate-pulse" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-bold">{chain.farmerName}</CardTitle>
                <span className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full",
                  allDone ? "bg-green-200 text-green-900" : "bg-red-200 text-red-900",
                )}>
                  {allDone ? "✓ Incident Resolved" : "⚡ Critical — Response Active"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {chain.village}, {chain.district}
                {" · "}Score:{" "}
                <span className="font-bold text-red-700">{chain.score}/100</span>
                {" · "}Triggered:{" "}
                <span className="font-medium">{format(chain.triggeredAt, "HH:mm:ss")}</span>
                {!allDone && elapsed > 0 && (
                  <span className="text-amber-600 ml-1 font-medium">(T+{elapsed}s)</span>
                )}
              </p>
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(v => !v)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
              onClick={onReset}
              title="Restart simulation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm" variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
              onClick={onDismiss}
              title="Dismiss chain"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress strip */}
        {expanded && (
          <div className="mt-3 space-y-1.5">
            {/* Bar */}
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  allDone ? "bg-green-500" : "bg-red-500",
                  !allDone && "animate-pulse",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {/* Stage label pills */}
            <div className="flex gap-1 flex-wrap">
              {STAGE_DEFS.map((def, i) => {
                const st = getStatus(i, elapsed);
                return (
                  <span
                    key={def.id}
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      st === "completed"   && "bg-green-100 text-green-800",
                      st === "in_progress" && "bg-amber-100 text-amber-800",
                      st === "pending"     && "bg-gray-100 text-gray-400",
                    )}
                  >
                    {st === "completed" ? "✓ " : st === "in_progress" ? "◐ " : "○ "}
                    {def.title}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>

      {/* ── Timeline body ── */}
      {expanded && (
        <CardContent className="px-5 pt-4 pb-5">
          <div className="space-y-0">
            {STAGE_DEFS.map((_, i) => (
              <StageRow
                key={STAGE_DEFS[i].id}
                stageIndex={i}
                data={chain.stages[i]}
                elapsed={elapsed}
                triggeredAt={chain.triggeredAt}
                isLast={i === STAGE_DEFS.length - 1}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Monitoring Mode — shown when no critical farmers are active
// ─────────────────────────────────────────────────────────────────────────────

interface MonitoringModeProps {
  farmers: FarmerRisk[];
  onDemo: () => void;
}

function MonitoringMode({ farmers, onDemo }: MonitoringModeProps) {
  const counts = {
    critical: farmers.filter(f => f.riskLevel === "critical").length,
    high:     farmers.filter(f => f.riskLevel === "high").length,
    medium:   farmers.filter(f => f.riskLevel === "medium").length,
    low:      farmers.filter(f => f.riskLevel === "low").length,
    safe:     farmers.filter(f => f.riskLevel === "safe").length,
  };

  const riskBands: Array<{
    key: keyof typeof counts;
    label: string;
    emoji: string;
    cls: string;
  }> = [
    { key: "critical", label: "Critical", emoji: "🚨", cls: "bg-red-50 border-red-200 text-red-700" },
    { key: "high",     label: "High",     emoji: "🔶", cls: "bg-orange-50 border-orange-200 text-orange-700" },
    { key: "medium",   label: "Medium",   emoji: "⚠️",  cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
    { key: "low",      label: "Low",      emoji: "🔵", cls: "bg-blue-50 border-blue-200 text-blue-700" },
    { key: "safe",     label: "Safe",     emoji: "✅", cls: "bg-green-50 border-green-200 text-green-700" },
  ];

  const chainPreview: Array<{ Icon: LucideIcon; label: string }> = [
    { Icon: Zap,          label: "Farmer at Risk"    },
    { Icon: Users,        label: "Family Notified"   },
    { Icon: MapPin,       label: "Village Volunteer" },
    { Icon: ShieldAlert,  label: "Emergency Officer" },
    { Icon: CheckCircle2, label: "Incident Closed"   },
  ];

  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-0">
        {/* Header strip */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Radio className="w-5 h-5 text-green-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Monitoring Mode Active</p>
              <p className="text-xs text-muted-foreground">
                Tracking {farmers.length} farmer{farmers.length !== 1 ? "s" : ""}
                {" · "}Response chain activates on <span className="font-semibold text-red-600">Critical</span> detection
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-full">
              ● Live
            </span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Risk distribution */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Current Risk Distribution
            </p>
            <div className="flex flex-wrap gap-2">
              {riskBands.map(band => (
                <div
                  key={band.key}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold",
                    band.cls,
                  )}
                >
                  <span>{band.emoji}</span>
                  <span>{counts[band.key]}</span>
                  <span className="font-medium opacity-80">{band.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Response chain preview */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Response Protocol (5 Stages)
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {chainPreview.map(({ Icon, label }, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 bg-muted/70 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {label}
                  </div>
                  {i < chainPreview.length - 1 && (
                    <span className="text-muted-foreground text-xs font-bold">↓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Demo trigger row */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">
              <span className="font-semibold text-foreground">No critical events detected.</span>
              {" "}Use the demo to preview the full response workflow.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 text-xs whitespace-nowrap flex-shrink-0"
              onClick={onDemo}
            >
              <Siren className="w-3.5 h-3.5" />
              Demo Chain
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────

export function EmergencyContactChain() {
  const { data: assessments = [], isLoading } = useGetFarmerRiskAssessments();
  const [chains, setChains] = useState<Record<number, ResponseChain>>({});
  const [now, setNow] = useState<Date>(() => new Date());
  const seenIds = useRef<Set<number>>(new Set());

  // Live clock — ticks every TICK_MS to advance simulation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // Auto-generate a chain the first time we see a critical farmer
  useEffect(() => {
    const critical = assessments.filter(a => a.riskLevel === "critical");
    if (!critical.length) return;

    setChains(prev => {
      let changed = false;
      const next = { ...prev };
      for (const farmer of critical) {
        if (!seenIds.current.has(farmer.farmerId)) {
          seenIds.current.add(farmer.farmerId);
          if (!next[farmer.farmerId]) {
            next[farmer.farmerId] = buildChain(farmer, new Date());
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [assessments]);

  // Demo trigger — uses highest-score farmer or a synthetic stand-in
  const handleDemo = useCallback(() => {
    const sorted = [...assessments].sort((a, b) => b.score - a.score);
    const base = sorted[0];
    const demo: Pick<FarmerRisk, "farmerId" | "farmerName" | "village" | "district" | "score"> = base
      ? { farmerId: base.farmerId, farmerName: base.farmerName, village: base.village, district: base.district, score: 95 }
      : { farmerId: 9999, farmerName: "Demo Farmer (Simulation)", village: "Warangal", district: "Warangal", score: 95 };
    setChains(prev => ({ ...prev, [demo.farmerId]: buildChain(demo, new Date()) }));
  }, [assessments]);

  const criticalCount = assessments.filter(a => a.riskLevel === "critical").length;
  const activeChains = Object.values(chains).filter(c => !c.dismissed);
  const inProgressCount = activeChains.filter(c => elapsedSeconds(c.triggeredAt, now) < COMPLETES_AT[COMPLETES_AT.length - 1]).length;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
          inProgressCount > 0 ? "bg-red-100" : "bg-muted",
        )}>
          <Siren className={cn("w-5 h-5", inProgressCount > 0 ? "text-red-600" : "text-muted-foreground")} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold leading-tight tracking-tight">Emergency Response Chain</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {criticalCount > 0
              ? `Auto-triggered for ${criticalCount} Critical Risk farmer${criticalCount !== 1 ? "s" : ""} · Updating every ${TICK_MS / 1000}s`
              : `Monitoring ${assessments.length} farmers · Auto-triggers on Critical Risk`}
          </p>
        </div>
        {inProgressCount > 0 && (
          <Badge className="bg-red-600 hover:bg-red-700 text-xs font-bold whitespace-nowrap flex-shrink-0">
            <span className="mr-1 animate-pulse">●</span>
            {inProgressCount} Active
          </Badge>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-20 rounded-xl bg-muted animate-pulse" />
          <div className="h-12 rounded-xl bg-muted animate-pulse opacity-60" />
        </div>
      ) : activeChains.length === 0 ? (
        <MonitoringMode farmers={assessments} onDemo={handleDemo} />
      ) : (
        <div className="space-y-4">
          {activeChains.map(chain => (
            <ResponseChainCard
              key={chain.farmerId}
              chain={chain}
              now={now}
              onDismiss={() =>
                setChains(prev => ({
                  ...prev,
                  [chain.farmerId]: { ...prev[chain.farmerId], dismissed: true },
                }))
              }
              onReset={() =>
                setChains(prev => ({
                  ...prev,
                  [chain.farmerId]: buildChain(chain, new Date()),
                }))
              }
            />
          ))}
        </div>
      )}

      {/* Divider before the alert log table */}
      <div className="h-px bg-border" />
    </section>
  );
}
