import { useState, useEffect, useRef } from "react";
import { useGetFarmerRiskAssessments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone, Users, ShieldAlert, CheckCircle2, Clock,
  Loader2, AlertTriangle, ChevronDown, ChevronUp,
  Siren, MapPin, RefreshCw, X, Radio, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addSeconds } from "date-fns";

// ─── Simulation timing (cumulative real seconds per stage) ────────────────────
const STAGE_DURATIONS = [45, 90, 140] as const;

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

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}
function fakePhone(seed: number): string {
  const prefixes = ["9849", "9440", "8886", "7036", "9963", "8978"];
  const suffix = String(1000 + (Math.abs(seed * 7919) % 9000));
  return `+91 ${pick(prefixes, seed)} ${suffix}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type StageStatus = "pending" | "in_progress" | "completed";

interface ChainStage {
  id: string;
  title: string;
  titleTe: string;
  assignedPerson: string;
  phone: string;
  role: string;
  notes: string;
}

interface LiveStage extends ChainStage {
  status: StageStatus;
  startedAt: Date | null;
  completedAt: Date | null;
}

interface ResponseChain {
  farmerId: number;
  farmerName: string;
  village: string;
  district: string;
  score: number;
  triggeredAt: Date;
  stages: ChainStage[];
  dismissed: boolean;
}

// ─── Compute live stage statuses ──────────────────────────────────────────────
function deriveStages(stages: ChainStage[], triggeredAt: Date, now: Date): LiveStage[] {
  const elapsed = (now.getTime() - triggeredAt.getTime()) / 1000;

  return stages.map((stage, i): LiveStage => {
    const prevDone = i === 0 ? 0 : STAGE_DURATIONS[i - 1];
    const thisDone = STAGE_DURATIONS[i];

    let status: StageStatus = "pending";
    let startedAt: Date | null = null;
    let completedAt: Date | null = null;

    if (elapsed >= prevDone) {
      startedAt = addSeconds(triggeredAt, prevDone);
      if (elapsed >= thisDone) {
        status = "completed";
        completedAt = addSeconds(triggeredAt, thisDone);
      } else {
        status = "in_progress";
      }
    }

    return { ...stage, status, startedAt, completedAt };
  });
}

// ─── Build a chain for a farmer ───────────────────────────────────────────────
function buildChain(
  farmer: { farmerId: number; farmerName: string; village: string; district: string; score: number },
  now: Date
): ResponseChain {
  const s = farmer.farmerId;
  return {
    farmerId: farmer.farmerId,
    farmerName: farmer.farmerName,
    village: farmer.village,
    district: farmer.district,
    score: farmer.score,
    triggeredAt: now,
    dismissed: false,
    stages: [
      {
        id: "family",
        title: "Family Notification",
        titleTe: "కుటుంబ నోటిఫికేషన్",
        assignedPerson: `${farmer.farmerName}'s ${pick(FAMILY_ROLES, s + 3)}`,
        phone: fakePhone(s),
        role: "Primary Contact",
        notes:
          "Immediate family contacted via SMS and automated voice call. Instructed to locate farmer and shelter indoors immediately.",
      },
      {
        id: "volunteer",
        title: "Village Volunteer",
        titleTe: "గ్రామ వాలంటీర్",
        assignedPerson: pick(VOLUNTEER_NAMES, s + 1),
        phone: fakePhone(s + 10),
        role: "Field Responder",
        notes:
          "Nearest trained village volunteer dispatched to farmer's last known location. Equipped with first-aid kit and shelter instructions.",
      },
      {
        id: "officer",
        title: "Emergency Officer",
        titleTe: "అత్యవసర అధికారి",
        assignedPerson: pick(OFFICER_NAMES, s + 2),
        phone: fakePhone(s + 20),
        role: "District Emergency Coordinator",
        notes:
          "District emergency officer alerted. 108 ambulance service notified. Rescue team placed on standby at taluk headquarters.",
      },
    ],
  };
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<StageStatus, {
  label: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  pending:     { label: "Pending",     badge: "bg-gray-100 text-gray-600 border-gray-200",    icon: Clock },
  in_progress: { label: "In Progress", badge: "bg-amber-100 text-amber-800 border-amber-300", icon: Loader2 },
  completed:   { label: "Completed",   badge: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
};

const stageIcons = [
  { Icon: Users,       activeBg: "bg-blue-600",  activeRing: "ring-blue-300",   pendingBg: "bg-blue-100"   },
  { Icon: MapPin,      activeBg: "bg-orange-500", activeRing: "ring-orange-300", pendingBg: "bg-orange-100" },
  { Icon: ShieldAlert, activeBg: "bg-red-600",   activeRing: "ring-red-300",    pendingBg: "bg-red-100"    },
];

// ─── Stage row ────────────────────────────────────────────────────────────────
function StageRow({ stage, index, isLast }: { stage: LiveStage; index: number; isLast: boolean }) {
  const sc = statusConfig[stage.status];
  const si = stageIcons[index];
  const { Icon } = si;
  const StatusIcon = sc.icon;

  const isDone    = stage.status === "completed";
  const isActive  = stage.status === "in_progress";
  const isPending = stage.status === "pending";

  return (
    <div className="flex gap-4">
      {/* Circle + connector */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center ring-2 flex-shrink-0 transition-all duration-500",
          isDone   && `${si.activeBg} ring-0`,
          isActive && `${si.pendingBg} ${si.activeRing} shadow-sm`,
          isPending && "bg-gray-100 ring-gray-200"
        )}>
          {isDone
            ? <CheckCircle2 className="w-5 h-5 text-white" />
            : <Icon className={cn("w-5 h-5", isActive ? "text-gray-700" : "text-gray-400")} />
          }
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 flex-1 my-1 min-h-[32px] rounded-full transition-colors duration-700",
            isDone ? "bg-green-400" : "bg-gray-200"
          )} />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "flex-1 mb-5 rounded-xl border p-4 transition-all duration-300",
        isDone   && "bg-green-50/60 border-green-200",
        isActive && "bg-white border-amber-300 shadow-sm",
        isPending && "bg-gray-50 border-gray-200 opacity-55"
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                "text-sm font-bold",
                isDone ? "text-green-800" : isActive ? "text-gray-900" : "text-gray-400"
              )}>
                {stage.title}
              </span>
              {isActive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{stage.titleTe}</p>
          </div>
          <Badge variant="outline" className={cn("text-[11px] font-semibold flex items-center gap-1", sc.badge)}>
            <StatusIcon className={cn("w-3 h-3", stage.status === "in_progress" && "animate-spin")} />
            {sc.label}
          </Badge>
        </div>

        {/* Person / phone / role */}
        <div className={cn("mt-3 grid sm:grid-cols-3 gap-y-1 gap-x-3 text-xs", isPending && "opacity-50")}>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium text-foreground truncate">{stage.assignedPerson}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono">{stage.phone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{stage.role}</span>
          </div>
        </div>

        {/* Times */}
        {(stage.startedAt || stage.completedAt) && (
          <div className={cn("flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground", isPending && "opacity-50")}>
            {stage.startedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started: <span className="font-medium text-foreground ml-0.5">{format(stage.startedAt, "HH:mm:ss")}</span>
              </span>
            )}
            {stage.completedAt && (
              <span className="flex items-center gap-1 text-green-700">
                <CheckCircle2 className="w-3 h-3" />
                Completed: <span className="font-medium ml-0.5">{format(stage.completedAt, "HH:mm:ss")}</span>
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {(isDone || isActive) && (
          <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed border-t border-dashed pt-2.5">
            {stage.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Single farmer chain card ─────────────────────────────────────────────────
function ResponseChainCard({
  chain, now, onDismiss, onReset,
}: {
  chain: ResponseChain;
  now: Date;
  onDismiss: () => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const liveStages = deriveStages(chain.stages, chain.triggeredAt, now);
  const allDone = liveStages.every(s => s.status === "completed");
  const elapsed = Math.floor((now.getTime() - chain.triggeredAt.getTime()) / 1000);

  return (
    <Card className={cn(
      "border-2 transition-all duration-500",
      allDone ? "border-green-400 bg-green-50/20" : "border-red-400 bg-red-50/10"
    )}>
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-start justify-between gap-3">
          {/* Title block */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              allDone ? "bg-green-100" : "bg-red-100"
            )}>
              {allDone
                ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                : <Siren className="w-5 h-5 text-red-600 animate-pulse" />
              }
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-bold leading-tight">{chain.farmerName}</CardTitle>
                <span className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  allDone ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                )}>
                  {allDone ? "✓ Chain Complete" : "⚡ Critical — Response Active"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {chain.village}, {chain.district}
                {" · "}Risk Score: <span className="font-bold text-red-700">{chain.score}/100</span>
                {" · "}Triggered: <span className="font-medium">{format(chain.triggeredAt, "HH:mm:ss")}</span>
                {!allDone && elapsed > 0 && <span className="text-amber-700 ml-1">(T+{elapsed}s)</span>}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(v => !v)} title={expanded ? "Collapse" : "Expand"}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-amber-600"
              onClick={onReset} title="Restart simulation">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
              onClick={onDismiss} title="Dismiss">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {expanded && (
          <div className="flex items-center gap-1.5 mt-3">
            {liveStages.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-1.5 flex-1">
                <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full transition-all duration-700",
                    stage.status === "completed"   && "w-full bg-green-500",
                    stage.status === "in_progress" && "w-1/2 bg-amber-400 animate-pulse",
                    stage.status === "pending"     && "w-0"
                  )} />
                </div>
                {i < liveStages.length - 1 && (
                  <div className={cn("w-2 h-px", stage.status === "completed" ? "bg-green-400" : "bg-gray-200")} />
                )}
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="px-5 pt-1 pb-4">
          <div className="mt-2">
            {liveStages.map((stage, i) => (
              <StageRow key={stage.id} stage={stage} index={i} isLast={i === liveStages.length - 1} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

type FarmerAssessment = NonNullable<ReturnType<typeof useGetFarmerRiskAssessments>["data"]>[number];

// ─── Monitoring / standby state (no critical farmers) ────────────────────────
function MonitoringStandby({
  assessments,
  onDemoTrigger,
}: {
  assessments: FarmerAssessment[];
  onDemoTrigger: () => void;
}) {
  const counts = {
    critical: assessments.filter(a => a.riskLevel === "critical").length,
    high:     assessments.filter(a => a.riskLevel === "high").length,
    medium:   assessments.filter(a => a.riskLevel === "medium").length,
    low:      assessments.filter(a => a.riskLevel === "low").length,
    safe:     assessments.filter(a => a.riskLevel === "safe").length,
  };

  const riskBands = [
    { key: "critical", label: "Critical", color: "text-red-700 bg-red-50 border-red-200"    },
    { key: "high",     label: "High",     color: "text-orange-700 bg-orange-50 border-orange-200" },
    { key: "medium",   label: "Medium",   color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    { key: "low",      label: "Low",      color: "text-blue-700 bg-blue-50 border-blue-200"  },
    { key: "safe",     label: "Safe",     color: "text-green-700 bg-green-50 border-green-200" },
  ] as const;

  return (
    <Card className="border-dashed border-2 border-muted">
      <CardContent className="py-6 px-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Radio className="w-5 h-5 text-green-600" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Monitoring All {assessments.length} Farmers</p>
            <p className="text-xs text-muted-foreground">
              Response chains auto-activate when any farmer reaches <span className="font-semibold text-red-700">Critical</span> risk
            </p>
          </div>
        </div>

        {/* Risk level breakdown */}
        <div className="flex flex-wrap gap-2 mb-5">
          {riskBands.map(band => (
            <div key={band.key} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold", band.color)}>
              <span className="text-base leading-none">
                {band.key === "critical" ? "🚨" : band.key === "high" ? "🔶" : band.key === "medium" ? "⚠️" : band.key === "low" ? "🔵" : "✅"}
              </span>
              <span>{counts[band.key]} {band.label}</span>
            </div>
          ))}
        </div>

        {/* Chain flow preview */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span className="font-medium text-foreground">Response Chain:</span>
          {[
            { icon: Users,       label: "Family Notification" },
            { icon: MapPin,      label: "Village Volunteer" },
            { icon: ShieldAlert, label: "Emergency Officer" },
          ].map(({ icon: Icon, label }, i, arr) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted rounded px-2 py-1">
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </div>
              {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>

        {/* Demo trigger */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-muted-foreground flex-1">
            <span className="font-medium text-foreground">Simulate a Critical event</span> — preview the full response workflow without affecting live data.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 text-xs"
            onClick={onDemoTrigger}
          >
            <Siren className="w-3.5 h-3.5" />
            Demo Chain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
export function EmergencyContactChain() {
  const { data: assessments = [], isLoading } = useGetFarmerRiskAssessments();
  const [chains, setChains] = useState<Record<number, ResponseChain>>({});
  const [now, setNow] = useState(() => new Date());
  const seenIds = useRef<Set<number>>(new Set());

  // Tick every 5s to advance simulation
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 5000);
    return () => clearInterval(id);
  }, []);

  // Auto-generate chains for newly detected critical farmers
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

  // Demo trigger: use the highest-risk farmer or a synthetic one
  const handleDemoTrigger = () => {
    const sorted = [...assessments].sort((a, b) => b.score - a.score);
    const target = sorted[0] ?? {
      farmerId: 9999,
      farmerName: "Demo Farmer",
      village: "Warangal",
      district: "Warangal",
      score: 95,
    };
    const synthetic = {
      farmerId: target.farmerId,
      farmerName: target.farmerName,
      village: target.village,
      district: target.district,
      score: 95,
    };
    const chain = buildChain(synthetic, new Date());
    setChains(prev => ({ ...prev, [synthetic.farmerId]: chain }));
  };

  const criticalCount = assessments.filter(a => a.riskLevel === "critical").length;
  const activeChains = Object.values(chains).filter(c => !c.dismissed);
  const inProgressCount = activeChains.filter(c => {
    const elapsed = (now.getTime() - c.triggeredAt.getTime()) / 1000;
    return elapsed < STAGE_DURATIONS[2];
  }).length;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <Siren className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold leading-tight">Emergency Response Chain</h2>
          <p className="text-xs text-muted-foreground">
            {criticalCount > 0
              ? `Auto-triggered for ${criticalCount} Critical Risk farmer${criticalCount !== 1 ? "s" : ""} · Simulation updates every 5s`
              : "Monitoring all farmers · Auto-triggers on Critical Risk detection"}
          </p>
        </div>
        {inProgressCount > 0 && (
          <Badge className="bg-red-600 hover:bg-red-700 text-xs whitespace-nowrap">
            {inProgressCount} Active
          </Badge>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-24 bg-muted animate-pulse rounded-xl" />
      ) : activeChains.length === 0 ? (
        <MonitoringStandby assessments={assessments} onDemoTrigger={handleDemoTrigger} />
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

      <div className="h-px bg-border" />
    </div>
  );
}
