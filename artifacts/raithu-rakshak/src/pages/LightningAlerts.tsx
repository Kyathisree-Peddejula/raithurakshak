import { useState } from "react";
import { useListLightningAlerts, useCreateLightningAlert, useDeleteLightningAlert, getListLightningAlertsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioTower, Plus, Trash2, CloudLightning } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function LightningAlerts() {
  const { data: alerts = [], isLoading } = useListLightningAlerts();
  const createAlert = useCreateLightningAlert();
  const deleteAlert = useDeleteLightningAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ district: "", severity: "medium" as "low" | "medium" | "high" | "critical", message: "" });

  const handleCreate = () => {
    if (!form.district || !form.message) {
      toast({ title: "District and message are required", variant: "destructive" });
      return;
    }
    createAlert.mutate({ data: form }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLightningAlertsQueryKey() });
        setOpen(false);
        setForm({ district: "", severity: "medium", message: "" });
        toast({ title: "Lightning alert issued" });
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteAlert.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLightningAlertsQueryKey() }),
    });
  };

  const active = alerts.filter(a => a.isActive);
  const inactive = alerts.filter(a => !a.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lightning Risk Alerts</h1>
          <p className="text-muted-foreground mt-1">Issue and manage lightning risk warnings by district.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Issue Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Lightning Risk Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>District</Label>
                <Input placeholder="Kurnool" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Severity Level</Label>
                <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v as typeof form.severity }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alert Message</Label>
                <Textarea
                  placeholder="Thunderstorm expected between 2 PM - 6 PM. Farmers advised to seek shelter immediately."
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreate} disabled={createAlert.isPending} className="w-full">
                {createAlert.isPending ? "Issuing..." : "Issue Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {active.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <RadioTower className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800">
            {active.length} active lightning alert{active.length !== 1 ? "s" : ""} in effect.
            Farmers in affected districts should seek shelter immediately.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading ? "Loading..." : `${alerts.length} total alert${alerts.length !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CloudLightning className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No lightning alerts issued.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...active, ...inactive].map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.district}</TableCell>
                    <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground line-clamp-2">{alert.message}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${alert.isActive ? "text-red-600" : "text-gray-400"}`}>
                        {alert.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(alert.createdAt), "dd MMM, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
                            <AlertDialogDescription>Remove this lightning alert for {alert.district}?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(alert.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
