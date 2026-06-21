import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardSummary, useGetRecentAlerts, useGetDistrictRisk } from "@workspace/api-client-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Users, AlertTriangle, CloudLightning, Map } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: recentAlerts = [], isLoading: loadingAlerts } = useGetRecentAlerts();
  const { data: districtRisk = [], isLoading: loadingRisk } = useGetDistrictRisk();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">District Command Dashboard</h1>
        <p className="text-muted-foreground">Real-time overview of farmer safety and lightning risks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.activeFarmers.toLocaleString() ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {summary?.totalFarmers.toLocaleString() ?? 0} total registered
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">Active Emergencies</CardTitle>
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
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">Lightning Alerts</CardTitle>
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
            <CardTitle className="text-sm font-medium">Critical Districts</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary?.criticalDistricts ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {summary?.totalDistricts ?? 0} monitored
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>District Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRisk ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : districtRisk.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No district risk data available.</div>
            ) : (
              <div className="space-y-4">
                {districtRisk.map(district => (
                  <div key={district.district} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{district.district}</p>
                      <p className="text-sm text-muted-foreground">{district.farmerCount.toLocaleString()} farmers at risk</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{district.alertCount} Alerts</p>
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
            <CardTitle>Recent Alerts Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent alerts.</div>
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
