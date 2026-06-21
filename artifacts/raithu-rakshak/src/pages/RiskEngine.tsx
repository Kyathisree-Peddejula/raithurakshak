import { useState } from "react";
import { useGetFarmerRiskAssessments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

const riskConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string; bar: string; icon: string }> = {
  safe:     { label: "Safe",        color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", bar: "bg-green-500",  icon: "✅" },
  low:      { label: "Low Risk",    color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  bar: "bg-blue-500",   icon: "🔵" },
  medium:   { label: "Medium Risk", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200",bar: "bg-yellow-500", icon: "⚠️" },
  high:     { label: "High Risk",   color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200",bar: "bg-orange-500", icon: "🔶" },
  critical: { label: "Critical",    color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200",   bar: "bg-red-600",    icon: "🚨" },
};

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

function FarmerRiskCard({ assessment }: { assessment: ReturnType<typeof useGetFarmerRiskAssessments>["data"] extends (infer T)[] | undefined ? T : never }) {
  const [expanded, setExpanded] = useState(false);
  const level = assessment.riskLevel as RiskLevel;
  const cfg = riskConfig[level];

  return (
    <Card className={cn("transition-all duration-200 border", level === "critical" && "ring-2 ring-red-400")}>
      <CardContent className="p-4">
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

            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Risk Score</span>
                <span className="text-xs font-semibold">{assessment.score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", cfg.bar)}
                  style={{ width: `${assessment.score}%` }}
                />
              </div>
            </div>

            {assessment.lastLocationAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Last location: {formatDistanceToNow(new Date(assessment.lastLocationAt), { addSuffix: true })}
              </p>
            )}
            {!assessment.lastLocationAt && (
              <p className="text-xs text-orange-600 mt-2 font-medium">⚠ No location on record</p>
            )}

            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Hide" : "Show"} details ({assessment.reasons.length} risk factor{assessment.reasons.length !== 1 ? "s" : ""})
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 grid md:grid-cols-2 gap-4 border-t pt-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold">Why this score?</span>
              </div>
              <ul className="space-y-1.5">
                {assessment.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-orange-400 mt-0.5 shrink-0">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Recommended Actions</span>
              </div>
              <ul className="space-y-1.5">
                {assessment.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreBand({ label, range, count, color }: { label: string; range: string; count: number; color: string }) {
  return (
    <div className={cn("rounded-lg border p-3 text-center", color)}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
      <div className="text-[10px] opacity-70">{range}</div>
    </div>
  );
}

export default function RiskEngine() {
  const { data: assessments = [], isLoading } = useGetFarmerRiskAssessments();
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  const counts = {
    critical: assessments.filter(a => a.riskLevel === "critical").length,
    high: assessments.filter(a => a.riskLevel === "high").length,
    medium: assessments.filter(a => a.riskLevel === "medium").length,
    low: assessments.filter(a => a.riskLevel === "low").length,
    safe: assessments.filter(a => a.riskLevel === "safe").length,
  };

  const filtered = filter === "all" ? assessments : assessments.filter(a => a.riskLevel === filter);

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
    : 0;

  const overallLevel: RiskLevel = avgScore <= 20 ? "safe" : avgScore <= 40 ? "low" : avgScore <= 60 ? "medium" : avgScore <= 80 ? "high" : "critical";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lightning Emergency Probability Engine</h1>
            <p className="text-muted-foreground">Real-time danger assessment for every registered farmer.</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="col-span-1 sm:col-span-1">
              <CardContent className="p-4 flex flex-col items-center gap-1">
                <ScoreRing score={avgScore} level={overallLevel} />
                <p className="text-xs font-semibold text-muted-foreground text-center mt-1">District Avg</p>
              </CardContent>
            </Card>
            <ScoreBand label="Critical" range="81–100" count={counts.critical} color="bg-red-50 border-red-200 text-red-700" />
            <ScoreBand label="High Risk" range="61–80" count={counts.high} color="bg-orange-50 border-orange-200 text-orange-700" />
            <ScoreBand label="Medium" range="41–60" count={counts.medium} color="bg-yellow-50 border-yellow-200 text-yellow-700" />
            <ScoreBand label="Low Risk" range="21–40" count={counts.low} color="bg-blue-50 border-blue-200 text-blue-700" />
            <ScoreBand label="Safe" range="0–20" count={counts.safe} color="bg-green-50 border-green-200 text-green-700" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
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
                {f === "all" ? `All (${assessments.length})` : `${riskConfig[f].label} (${counts[f]})`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                No farmers found for this filter.
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

      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">How Scores Are Computed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-muted-foreground">
            {[
              { factor: "District Lightning Risk", pts: "Up to +40 pts", note: "Critical weather = highest weight" },
              { factor: "Active Lightning Alert", pts: "Up to +20 pts", note: "Officially issued district alerts" },
              { factor: "Unresolved Emergency", pts: "+25 pts", note: "Farmer has an open emergency on record" },
              { factor: "Storm Conditions", pts: "Up to +15 pts", note: "Thunderstorm, severe weather strings" },
              { factor: "High Wind Speed", pts: "Up to +10 pts", note: ">40 km/h adds maximum wind penalty" },
              { factor: "Time Since Last Contact", pts: "Up to +15 pts", note: ">6 hrs with no location update" },
            ].map(f => (
              <div key={f.factor} className="flex flex-col gap-0.5 border rounded p-2.5 bg-background">
                <span className="font-semibold text-foreground">{f.factor}</span>
                <span className="text-primary font-medium">{f.pts}</span>
                <span>{f.note}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
