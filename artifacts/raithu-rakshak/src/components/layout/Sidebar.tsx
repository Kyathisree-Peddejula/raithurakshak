import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  CloudLightning, 
  MapPin, 
  AlertTriangle, 
  RadioTower,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farmers", label: "Farmers Registry", icon: Users },
  { href: "/family", label: "Family Management", icon: UserPlus },
  { href: "/weather", label: "Weather Radar", icon: CloudLightning },
  { href: "/alerts/lightning", label: "Lightning Risk", icon: RadioTower },
  { href: "/alerts/emergency", label: "Emergency Alerts", icon: AlertTriangle },
  { href: "/locations", label: "Live Locations", icon: MapPin },
  { href: "/risk", label: "Risk Engine", icon: Zap, highlight: true },
  { href: "/timeline", label: "Incident Timeline", icon: Clock },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-shrink-0">
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
          <RadioTower className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">RaithuRakshak</h1>
          <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wider font-semibold">Command Center</span>
        </div>
      </div>
      
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  item.highlight && !isActive && "border border-amber-500/40 text-amber-300 hover:text-amber-200"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60",
                  item.highlight && !isActive && "text-amber-400"
                )} />
                {item.label}
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded-full">AI</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-md p-3">
          <p className="text-xs font-semibold text-sidebar-foreground mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs text-sidebar-foreground/80">All systems nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
