import { useState } from "react";
import { useGetTimeline, useListFarmers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, CloudLightning, AlertTriangle, UserCheck, Zap } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type EventType = "emergency" | "lightning_alert" | "location_update" | "registration";

const eventConfig: Record<EventType, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  lineDot: string;
}> = {
  emergency:       { icon: AlertTriangle,  iconBg: "bg-red-100",    iconColor: "text-red-600",    lineDot: "bg-red-500" },
  lightning_alert: { icon: CloudLightning, iconBg: "bg-amber-100",  iconColor: "text-amber-600",  lineDot: "bg-amber-500" },
  location_update: { icon: MapPin,         iconBg: "bg-blue-100",   iconColor: "text-blue-600",   lineDot: "bg-blue-400" },
  registration:    { icon: UserCheck,      iconBg: "bg-green-100",  iconColor: "text-green-600",  lineDot: "bg-green-500" },
};

const severityColors: Record<string, string> = {
  critical: "text-red-700 bg-red-50 border-red-200",
  high:     "text-orange-700 bg-orange-50 border-orange-200",
  medium:   "text-yellow-700 bg-yellow-50 border-yellow-200",
  low:      "text-green-700 bg-green-50 border-green-200",
};

function groupByDate(events: { timestamp: string }[]) {
  const groups: Record<string, typeof events> = {};
  for (const e of events) {
    const day = format(new Date(e.timestamp), "yyyy-MM-dd");
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  }
  return groups;
}

function dateSectionLabel(dateKey: string) {
  const d = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Today";
  if (format(d, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) return "Yesterday";
  return format(d, "d MMM yyyy");
}

export default function Timeline() {
  const [selectedFarmer, setSelectedFarmer] = useState<string>("all");
  const { data: farmers = [] } = useListFarmers();
  const { data: events = [], isLoading } = useGetTimeline(
    selectedFarmer !== "all" ? { farmerId: parseInt(selectedFarmer) } : undefined
  );

  const grouped = groupByDate(events);
  const dateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const typeCounts = {
    emergency: events.filter(e => e.type === "emergency").length,
    lightning_alert: events.filter(e => e.type === "lightning_alert").length,
    location_update: events.filter(e => e.type === "location_update").length,
    registration: events.filter(e => e.type === "registration").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incident Timeline</h1>
            <p className="text-muted-foreground">Chronological history of events for all registered farmers.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Farmer:</span>
          <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All farmers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Farmers</SelectItem>
              {farmers.map(f => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.name} — {f.village}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isLoading && events.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {typeCounts.emergency > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                {typeCounts.emergency} Emergency
              </span>
            )}
            {typeCounts.lightning_alert > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                {typeCounts.lightning_alert} Lightning Alert
              </span>
            )}
            {typeCounts.location_update > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {typeCounts.location_update} Location Update
              </span>
            )}
            {typeCounts.registration > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium">
                {typeCounts.registration} Registration
              </span>
            )}
          </div>
        )}
      </div>

      {/* Timeline body */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No events found{selectedFarmer !== "all" ? " for this farmer" : ""}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {dateKeys.map(dateKey => (
            <div key={dateKey}>
              {/* Date section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                  {dateSectionLabel(dateKey)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Events in this date group */}
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {grouped[dateKey].map((event, idx) => {
                    const cfg = eventConfig[event.type as EventType] ?? eventConfig.registration;
                    const Icon = cfg.icon;

                    return (
                      <div key={`${event.id}-${idx}`} className="flex gap-4 relative">
                        {/* Icon dot */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-2 ring-background",
                          cfg.iconBg
                        )}>
                          <Icon className={cn("w-4 h-4", cfg.iconColor)} />
                        </div>

                        {/* Content card */}
                        <div className="flex-1 pb-2">
                          <Card className="shadow-none hover:shadow-sm transition-shadow">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm">{event.title}</p>
                                    {event.severity && (
                                      <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide",
                                        severityColors[event.severity] ?? severityColors.low
                                      )}>
                                        {event.severity}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    {event.description}
                                  </p>
                                  {selectedFarmer === "all" && (
                                    <p className="text-xs font-medium text-primary mt-1">
                                      {event.farmerName} · {event.district}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {format(new Date(event.timestamp), "HH:mm")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground/70">
                                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Types</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-4 flex-wrap">
            {(Object.entries(eventConfig) as [EventType, typeof eventConfig[EventType]][]).map(([type, cfg]) => {
              const Icon = cfg.icon;
              const label = type === "emergency" ? "Emergency Alert" : type === "lightning_alert" ? "Lightning Alert" : type === "location_update" ? "Location Update" : "Farmer Registration";
              return (
                <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", cfg.iconBg)}>
                    <Icon className={cn("w-3 h-3", cfg.iconColor)} />
                  </div>
                  {label}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
