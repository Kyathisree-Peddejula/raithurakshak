import { useListLocations, useListFarmers, useUpdateFarmerLocation, getListLocationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Locations() {
  const { data: locations = [], isLoading, refetch } = useListLocations();
  const { data: farmers = [] } = useListFarmers();
  const updateLocation = useUpdateFarmerLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ farmerId: "", lat: "", lng: "" });

  const filtered = locations.filter(
    l =>
      l.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      l.district.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdate = () => {
    if (!form.farmerId || !form.lat || !form.lng) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    updateLocation.mutate({
      farmerId: parseInt(form.farmerId),
      data: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        setOpen(false);
        setForm({ farmerId: "", lat: "", lng: "" });
        toast({ title: "Location updated" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Locations</h1>
          <p className="text-muted-foreground mt-1">Last known GPS coordinates of all registered farmers.</p>
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
                Update Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Farmer Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Farmer</Label>
                  <Select value={form.farmerId} onValueChange={v => setForm(p => ({ ...p, farmerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select farmer" /></SelectTrigger>
                    <SelectContent>
                      {farmers.map(f => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.name} — {f.village}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input type="number" step="any" placeholder="15.8281" value={form.lat} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input type="number" step="any" placeholder="78.0373" value={form.lng} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleUpdate} disabled={updateLocation.isPending} className="w-full">
                  {updateLocation.isPending ? "Updating..." : "Update Location"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base">
            {isLoading ? "Loading..." : `${filtered.length} farmer location${filtered.length !== 1 ? "s" : ""}`}
          </CardTitle>
          <div className="relative w-64">
            <Input
              placeholder="Search by name or district..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-3"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No location data available</p>
              <p className="text-sm mt-1">Update farmer locations to track them here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Latitude</TableHead>
                  <TableHead>Longitude</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(loc => (
                  <TableRow key={loc.farmerId}>
                    <TableCell className="font-medium">{loc.farmerName}</TableCell>
                    <TableCell>{loc.district}</TableCell>
                    <TableCell className="font-mono text-sm">{loc.lat.toFixed(4)}</TableCell>
                    <TableCell className="font-mono text-sm">{loc.lng.toFixed(4)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(loc.recordedAt), "dd MMM yyyy, HH:mm")}
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
