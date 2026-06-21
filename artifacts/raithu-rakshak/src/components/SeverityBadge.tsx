import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Severity = "low" | "medium" | "high" | "critical";

interface SeverityBadgeProps {
  severity: Severity | string;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const normalizedSeverity = severity.toLowerCase() as Severity;
  
  const variants: Record<Severity, string> = {
    low: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
    high: "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
    critical: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("capitalize font-semibold uppercase tracking-wider text-[10px]", variants[normalizedSeverity as Severity] || variants.medium, className)}
    >
      {severity}
    </Badge>
  );
}
