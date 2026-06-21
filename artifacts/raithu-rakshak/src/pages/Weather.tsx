import { useState } from "react";
import { useListWeatherData, useUpsertWeatherData, getListWeatherDataQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Thermometer, Droplets, Wind, CloudLightning, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function WeatherCard({ data }: { data: { id: number; district: string; temperature: number; humidity: number; windSpeed: number; lightningRisk: string; condition: string; updatedAt: string } }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg">{data.district}</CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{data.condition}</p>
        </div>
        <SeverityBadge severity={data.lightningRisk} />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-lg">
            <Thermometer className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-bold">{data.temperature}°C</span>
            <span className="text-xs text-muted-foreground">Temp</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-lg">
            <Droplets className="w-5 h-5 text-blue-500" />
            <span className="text-lg font-bold">{data.humidity}%</span>
            <span className="text-xs text-muted-foreground">Humidity</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 bg-muted/40 rounded-lg">
            <Wind className="w-5 h-5 text-gray-500" />
            <span className="text-lg font-bold">{data.windSpeed}</span>
            <span className="text-xs text-muted-foreground">km/h</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Updated {format(new Date(data.updatedAt), "dd MMM, HH:mm")}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Weather() {
  const { data: weatherData = [], isLoading, refetch } = useListWeatherData();
  const upsertWeather = useUpsertWeatherData();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    district: "", temperature: "", humidity: "", windSpeed: "",
    lightningRisk: "low" as "low" | "medium" | "high" | "critical",
    condition: "",
  });

  const handleSubmit = () => {
    if (!form.district || !form.temperature || !form.humidity || !form.windSpeed || !form.condition) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    upsertWeather.mutate({
      data: {
        district: form.district,
        temperature: parseFloat(form.temperature),
        humidity: parseFloat(form.humidity),
        windSpeed: parseFloat(form.windSpeed),
        lightningRisk: form.lightningRisk,
        condition: form.condition,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWeatherDataQueryKey() });
        setOpen(false);
        setForm({ district: "", temperature: "", humidity: "", windSpeed: "", lightningRisk: "low", condition: "" });
        toast({ title: "Weather data updated" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weather Monitoring</h1>
          <p className="text-muted-foreground mt-1">Real-time weather conditions and lightning risk by district.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add/Update District
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Weather Data</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>District</Label>
                  <Input placeholder="Kurnool" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature (°C)</Label>
                    <Input type="number" placeholder="32" value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Humidity (%)</Label>
                    <Input type="number" placeholder="75" value={form.humidity} onChange={e => setForm(p => ({ ...p, humidity: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Wind Speed (km/h)</Label>
                    <Input type="number" placeholder="25" value={form.windSpeed} onChange={e => setForm(p => ({ ...p, windSpeed: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lightning Risk</Label>
                    <Select value={form.lightningRisk} onValueChange={v => setForm(p => ({ ...p, lightningRisk: v as typeof form.lightningRisk }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weather Condition</Label>
                  <Input placeholder="Thunderstorm, Partly Cloudy..." value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))} />
                </div>
                <Button onClick={handleSubmit} disabled={upsertWeather.isPending}>
                  {upsertWeather.isPending ? "Saving..." : "Save Weather Data"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : weatherData.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <CloudLightning className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No weather data available</p>
            <p className="text-sm mt-1">Add weather data for districts to monitor conditions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weatherData.map(d => <WeatherCard key={d.id} data={d} />)}
        </div>
      )}
    </div>
  );
}
