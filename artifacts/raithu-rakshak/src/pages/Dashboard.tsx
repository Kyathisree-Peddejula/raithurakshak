import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, useGetRecentAlerts, useGetDistrictRisk, useGetFarmerRiskAssessments } from "@workspace/api-client-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Users, AlertTriangle, CloudLightning, Map, Zap, ArrowRight, Phone, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useLang } from "@/context/LanguageContext";

const riskColors: Record<string, { bar: string; text: string; bg: string }> = {
  safe:     { bar: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50" },
  low:      { bar: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50" },
  medium:   { bar: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" },
  high:     { bar: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
  critical: { bar: "bg-red-600",    text: "text-red-700",    bg: "bg-red-50" },
};

const familyPriorityConfig = {
  medium:   { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", dot: "bg-yellow-500", icon: Phone },
  high:     { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", dot: "bg-orange-500", icon: AlertTriangle },
  critical: { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-900",    dot: "bg-red-600",    icon: MapPin },
};

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: recentAlerts = [], isLoading: loadingAlerts } = useGetRecentAlerts();
  const { data: districtRisk = [], isLoading: loadingRisk } = useGetDistrictRisk();
  const { data: riskAssessments = [], isLoading: loadingRisk2 } = useGetFarmerRiskAssessments();
  const { lang } = useLang();

  const topRisks = [...riskAssessments].sort((a, b) => b.score - a.score).slice(0, 4);

  // Family rescue: farmers with medium/high/critical who have a family recommendation
  const familyRescue = [...riskAssessments]
    .filter(a => ["medium", "high", "critical"].includes(a.riskLevel) && a.familyRecommendation)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {lang === "te" ? "జిల్లా కమాండ్ డాష్‌బోర్డ్" : "District Command Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {lang === "te" ? "రైతు భద్రత మరియు పిడుగుల ప్రమాదాల నిజ-సమయ అవలోకనం." : "Real-time overview of farmer safety and lightning risks."}
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "te" ? "సక్రియ రైతులు" : "Active Farmers"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.activeFarmers.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "te"
                    ? `${summary?.totalFarmers ?? 0} మొత్తం నమోదు`
                    : `of ${summary?.totalFarmers.toLocaleString() ?? 0} total registered`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">
              {lang === "te" ? "సక్రియ అత్యవసర పరిస్థితులు" : "Active Emergencies"}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 w-16 bg-orange-200/50 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{summary?.activeEmergencyAlerts ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {lang === "te" ? "పిడుగుల హెచ్చరికలు" : "Lightning Alerts"}
            </CardTitle>
            <CloudLightning className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 w-16 bg-amber-200/50 animate-pulse rounded" />
            ) : (
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary?.activeLightningAlerts ?? 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {lang === "te" ? "విపత్కర జిల్లాలు" : "Critical Districts"}
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.criticalDistricts ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {lang === "te"
                    ? `${summary?.totalDistricts ?? 0} పర్యవేక్షించబడుతున్నాయి`
                    : `of ${summary?.totalDistricts ?? 0} monitored`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Engine Widget */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">
              {lang === "te" ? "పిడుగుల ప్రమాద ఇంజిన్ — అత్యధిక ప్రమాదాలు" : "Lightning Risk Engine — Top Risks"}
            </CardTitle>
          </div>
          <Link href="/risk">
            <span className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer">
              {lang === "te" ? "పూర్తి నివేదిక" : "Full report"} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingRisk2 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : topRisks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {lang === "te" ? "రైతు ప్రమాద డేటా అందుబాటులో లేదు." : "No farmer risk data available."}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {topRisks.map(a => {
                const cfg = riskColors[a.riskLevel] ?? riskColors.safe;
                return (
                  <div key={a.farmerId} className={cn("rounded-lg border p-3 flex flex-col gap-2", cfg.bg)}>
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="font-semibold text-sm leading-tight">{a.farmerName}</p>
                        <p className="text-xs text-muted-foreground">{a.village}</p>
                      </div>
                      <span className={cn("text-xl font-bold leading-none tabular-nums", cfg.text)}>{a.score}</span>
                    </div>
                    <div>
                      <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <div className={cn("h-full rounded-full", cfg.bar)} style={{ width: `${a.score}%` }} />
                      </div>
                      <p className={cn("text-[11px] font-semibold mt-1 capitalize", cfg.text)}>{a.riskLevel.replace("_", " ")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Rescue Recommendations */}
      {(loadingRisk2 || familyRescue.length > 0) && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-base">
                {lang === "te" ? "కుటుంబ రక్షణ హెచ్చరికలు" : "Family Rescue Alerts"}
              </CardTitle>
            </div>
            <Link href="/risk">
              <span className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer">
                {lang === "te" ? "అన్నీ చూపు" : "View all"} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingRisk2 ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
              </div>
            ) : familyRescue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {lang === "te" ? "కుటుంబ చర్య అవసరమైన రైతులు లేరు." : "No farmers currently need family rescue action."}
              </p>
            ) : (
              <div className="space-y-2">
                {familyRescue.map(a => {
                  const rec = a.familyRecommendation!;
                  const priority = rec.priority as keyof typeof familyPriorityConfig;
                  const cfg = familyPriorityConfig[priority] ?? familyPriorityConfig.medium;
                  const Icon = cfg.icon;

                  return (
                    <div key={a.farmerId} className={cn("rounded-lg border p-3 flex items-start gap-3", cfg.bg, cfg.border)}>
                      <div className="mt-0.5 shrink-0">
                        <div className={cn("w-2 h-2 rounded-full mt-1", cfg.dot)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={cn("font-semibold text-sm", cfg.text)}>{a.farmerName}</span>
                          <span className="text-xs text-muted-foreground">{a.village}, {a.district}</span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", cfg.dot === "bg-red-600" ? "bg-red-200 text-red-900" : cfg.dot === "bg-orange-500" ? "bg-orange-200 text-orange-900" : "bg-yellow-200 text-yellow-900")}>
                            {lang === "te" ? rec.urgencyTe : rec.urgency}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", cfg.text)} />
                          <p className={cn("text-xs leading-snug", cfg.text)}>
                            {lang === "te" ? rec.actionTe : rec.action}
                          </p>
                        </div>
                        {rec.reasons.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                            {lang === "te" ? "కారణం:" : "Because:"} {rec.reasons[0]}
                            {rec.reasons.length > 1 && ` (+${rec.reasons.length - 1} more)`}
                          </p>
                        )}
                      </div>
                      <span className={cn("text-lg font-bold tabular-nums shrink-0", riskColors[a.riskLevel]?.text)}>
                        {a.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>{lang === "te" ? "జిల్లా ప్రమాద అంచనా" : "District Risk Assessment"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : districtRisk.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang === "te" ? "జిల్లా ప్రమాద డేటా అందుబాటులో లేదు." : "No district risk data available."}
              </div>
            ) : (
              <div className="space-y-4">
                {districtRisk.map(district => (
                  <div key={district.district} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{district.district}</p>
                      <p className="text-sm text-muted-foreground">
                        {district.farmerCount.toLocaleString()} {lang === "te" ? "ప్రమాదంలో రైతులు" : "farmers at risk"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{district.alertCount} {lang === "te" ? "హెచ్చరికలు" : "Alerts"}</p>
                      </div>
                      <SeverityBadge severity={district.riskLevel} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{lang === "te" ? "తాజా హెచ్చరికల ఫీడ్" : "Recent Alerts Feed"}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {lang === "te" ? "తాజా హెచ్చరికలు లేవు." : "No recent alerts."}
              </div>
            ) : (
              <div className="space-y-4">
                {recentAlerts.slice(0, 5).map((alert, idx) => (
                  <div key={`${alert.type}-${alert.id}-${idx}`} className="flex flex-col gap-1 border-l-2 border-primary pl-4 py-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{alert.type}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(alert.createdAt), 'HH:mm')}</span>
                    </div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
                      <SeverityBadge severity={alert.severity} className="ml-2 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
