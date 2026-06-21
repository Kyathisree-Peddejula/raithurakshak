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
import { useLang, teluguAlertBanner } from "@/context/LanguageContext";

const defaultTeluguByDistrict: Record<string, string> = {
  critical: "పిడుగుల ప్రమాదం ఉంది. వెంటనే సురక్షిత ప్రదేశానికి వెళ్లండి.",
  high:     "పిడుగుల ప్రమాదం అధికంగా ఉంది. పొలాలలో పని ఆపండి.",
  medium:   "పిడుగుల ప్రమాదం ఉంది. జాగ్రత్తగా ఉండండి.",
  low:      "తక్కువ పిడుగుల ప్రమాదం. వాతావరణ నవీకరణలను గమనించండి.",
};

export default function LightningAlerts() {
  const { data: alerts = [], isLoading } = useListLightningAlerts();
  const createAlert = useCreateLightningAlert();
  const deleteAlert = useDeleteLightningAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { lang, toggle } = useLang();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    district: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
    message: "",
    messageTe: "",
  });

  const handleCreate = () => {
    if (!form.district || !form.message) {
      toast({ title: lang === "te" ? "జిల్లా మరియు సందేశం అవసరం" : "District and message are required", variant: "destructive" });
      return;
    }
    createAlert.mutate({
      data: {
        district: form.district,
        severity: form.severity,
        message: form.message,
        messageTe: form.messageTe || defaultTeluguByDistrict[form.severity],
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLightningAlertsQueryKey() });
        setOpen(false);
        setForm({ district: "", severity: "medium", message: "", messageTe: "" });
        toast({ title: lang === "te" ? "పిడుగుల హెచ్చరిక జారీ చేయబడింది" : "Lightning alert issued" });
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

  const getDisplayMessage = (alert: typeof alerts[0]) => {
    if (lang === "te") return alert.messageTe || defaultTeluguByDistrict[alert.severity] || alert.message;
    return alert.message;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {lang === "te" ? "పిడుగుల ప్రమాద హెచ్చరికలు" : "Lightning Risk Alerts"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "te" ? "జిల్లా వారీగా పిడుగుల ప్రమాద హెచ్చరికలు జారీ చేయండి." : "Issue and manage lightning risk warnings by district."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggle}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors hover:bg-accent"
          >
            <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
            <span className="text-muted-foreground/50 mx-0.5">|</span>
            <span className={lang === "te" ? "text-primary" : "text-muted-foreground"}>తె</span>
          </button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {lang === "te" ? "హెచ్చరిక జారీ" : "Issue Alert"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {lang === "te" ? "పిడుగుల ప్రమాద హెచ్చరిక జారీ చేయండి" : "Issue Lightning Risk Alert"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{lang === "te" ? "జిల్లా" : "District"}</Label>
                  <Input placeholder="Kurnool" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{lang === "te" ? "తీవ్రత స్థాయి" : "Severity Level"}</Label>
                  <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v as typeof form.severity }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{lang === "te" ? "తక్కువ" : "Low"}</SelectItem>
                      <SelectItem value="medium">{lang === "te" ? "మధ్యస్థ" : "Medium"}</SelectItem>
                      <SelectItem value="high">{lang === "te" ? "అధికం" : "High"}</SelectItem>
                      <SelectItem value="critical">{lang === "te" ? "విపత్కరం" : "Critical"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">EN</span>
                    Alert Message
                  </Label>
                  <Textarea
                    placeholder="Thunderstorm expected between 2 PM - 6 PM. Farmers advised to seek shelter immediately."
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">తె</span>
                    Telugu Message (optional — auto-filled if blank)
                  </Label>
                  <Textarea
                    placeholder={defaultTeluguByDistrict[form.severity]}
                    value={form.messageTe}
                    onChange={e => setForm(p => ({ ...p, messageTe: e.target.value }))}
                    rows={2}
                    className="font-[sans-serif]"
                  />
                  {!form.messageTe && (
                    <p className="text-xs text-muted-foreground">
                      Auto: "{defaultTeluguByDistrict[form.severity]}"
                    </p>
                  )}
                </div>
                <Button onClick={handleCreate} disabled={createAlert.isPending} className="w-full">
                  {createAlert.isPending
                    ? (lang === "te" ? "జారీ చేస్తున్నారు..." : "Issuing...")
                    : (lang === "te" ? "హెచ్చరిక జారీ చేయండి" : "Issue Alert")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active alert banner — bilingual */}
      {active.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <RadioTower className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-medium text-red-800">
              {lang === "te"
                ? `${active.length} సక్రియ పిడుగుల హెచ్చరిక(లు) అమలులో ఉన్నాయి.`
                : `${active.length} active lightning alert${active.length !== 1 ? "s" : ""} in effect.`}
            </p>
          </div>
          {lang === "te" && active[0] && (
            <p className="text-sm font-semibold text-red-900 pl-8">
              {teluguAlertBanner[active[0].severity] ?? teluguAlertBanner.medium}
            </p>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isLoading
              ? (lang === "te" ? "లోడ్ అవుతోంది..." : "Loading...")
              : `${alerts.length} total alert${alerts.length !== 1 ? "s" : ""}`}
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
              <p>{lang === "te" ? "పిడుగుల హెచ్చరికలు ఏవీ జారీ చేయబడలేదు." : "No lightning alerts issued."}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{lang === "te" ? "జిల్లా" : "District"}</TableHead>
                  <TableHead>{lang === "te" ? "తీవ్రత" : "Severity"}</TableHead>
                  <TableHead>
                    <span className="flex items-center gap-1.5">
                      {lang === "te" ? "సందేశం" : "Message"}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lang === "te" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {lang === "te" ? "తె" : "EN"}
                      </span>
                    </span>
                  </TableHead>
                  <TableHead>{lang === "te" ? "స్థితి" : "Status"}</TableHead>
                  <TableHead>{lang === "te" ? "జారీ చేసిన సమయం" : "Issued At"}</TableHead>
                  <TableHead className="text-right">{lang === "te" ? "చర్యలు" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...active, ...inactive].map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.district}</TableCell>
                    <TableCell><SeverityBadge severity={alert.severity} /></TableCell>
                    <TableCell className="max-w-xs text-sm text-muted-foreground">
                      <p className="line-clamp-2">{getDisplayMessage(alert)}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold uppercase tracking-wider ${alert.isActive ? "text-red-600" : "text-gray-400"}`}>
                        {alert.isActive
                          ? (lang === "te" ? "సక్రియ" : "Active")
                          : (lang === "te" ? "నిష్క్రియ" : "Inactive")}
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
                            <AlertDialogTitle>{lang === "te" ? "హెచ్చరికను తొలగించండి" : "Delete Alert"}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {lang === "te"
                                ? `${alert.district} కోసం ఈ పిడుగుల హెచ్చరికను తొలగించాలా?`
                                : `Remove this lightning alert for ${alert.district}?`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{lang === "te" ? "రద్దు" : "Cancel"}</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(alert.id)}>
                              {lang === "te" ? "తొలగించు" : "Delete"}
                            </AlertDialogAction>
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
