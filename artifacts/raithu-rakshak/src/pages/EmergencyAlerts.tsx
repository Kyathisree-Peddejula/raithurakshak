import { useState } from "react";
import { useListEmergencyAlerts, useCreateEmergencyAlert, useResolveEmergencyAlert, getListEmergencyAlertsQueryKey, useListFarmers } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Plus, CheckCircle, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { EmergencyContactChain } from "@/components/emergency/EmergencyContactChain";

const EMERGENCY_TYPES = {
  lightning_strike: "Lightning Strike",
  medical: "Medical Emergency",
  missing: "Missing Person",
  other: "Other",
};

export default function EmergencyAlerts() {
  const { data: alerts = [], isLoading } = useListEmergencyAlerts();
  const { data: farmers = [] } = useListFarmers();
  const createAlert = useCreateEmergencyAlert();
  const resolveAlert = useResolveEmergencyAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    farmerId: "",
    type: "lightning_strike" as "lightning_strike" | "medical" | "missing" | "other",
    message: "",
    lat: "",
    lng: "",
  });

  const handleCreate = () => {
    if (!form.farmerId || !form.message) {
      toast({ title: "Farmer and message are required", variant: "destructive" });
      return;
    }
    createAlert.mutate({
      data: {
        farmerId: parseInt(form.farmerId),
        type: form.type,
        message: form.message,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmergencyAlertsQueryKey() });
        setOpen(false);
        setForm({ farmerId: "", type: "lightning_strike", message: "", lat: "", lng: "" });
        toast({ title: "Emergency alert created" });
      },
    });
  };

  const handleResolve = (id: number) => {
    resolveAlert.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmergencyAlertsQueryKey() });
        toast({ title: "Emergency marked as resolved" });
      },
    });
  };

  const active = alerts.filter(a => !a.isResolved);
  const resolved = alerts.filter(a => a.isResolved);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Alerts</h1>
          <p className="text-muted-foreground mt-1">Track and respond to farmer emergencies in real time.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4" />
              Report Emergency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-700">Report Farmer Emergency</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Farmer *</Label>
                <Select value={form.farmerId} onValueChange={v => setForm(p => ({ ...p, farmerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                  <SelectContent>
                    {farmers.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.name} — {f.village}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Emergency Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as typeof form.type }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMERGENCY_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the emergency situation..."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude (Optional)</Label>
                  <Input type="number" step="any" placeholder="15.8281" value={form.lat} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Longitude (Optional)</Label>
                  <Input type="number" step="any" placeholder="78.0373" value={form.lng} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createAlert.isPending} className="w-full bg-red-600 hover:bg-red-700">
                {createAlert.isPending ? "Reporting..." : "Report Emergency"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active alert banner */}
      {active.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 animate-pulse" />
          <p className="text-sm font-bold text-red-800">
            {active.length} ACTIVE EMERGENCY{active.length !== 1 ? " ALERTS" : " ALERT"} — IMMEDIATE RESPONSE REQUIRED
          </p>
        </div>
      )}

      {/* ── Emergency Contact Chain ── auto-triggered for Critical Risk farmers */}
      <EmergencyContactChain />

      {/* Alert log table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isLoading ? "Loading..." : `${alerts.length} total emergency reports`}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30 text-green-600" />
              <p className="font-medium">No emergencies reported</p>
              <p className="text-sm mt-1">All farmers are safe.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...active, ...resolved].map(alert => (
                  <TableRow key={alert.id} className={!alert.isResolved ? "bg-red-50/30" : ""}>
                    <TableCell className="font-medium">
                      <div>{alert.farmerName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${!alert.isResolved ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-600"}`}>
                        {EMERGENCY_TYPES[alert.type as keyof typeof EMERGENCY_TYPES] ?? alert.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground line-clamp-2">{alert.message}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {alert.lat && alert.lng ? `${alert.lat.toFixed(3)}, ${alert.lng.toFixed(3)}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={alert.isResolved ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                        {alert.isResolved ? "Resolved" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(alert.createdAt), "dd MMM, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
