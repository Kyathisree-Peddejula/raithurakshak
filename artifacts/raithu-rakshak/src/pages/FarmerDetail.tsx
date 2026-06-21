import { useParams, useLocation } from "wouter";
import {
  useGetFarmer, getGetFarmerQueryKey,
  useListFamilyMembers, getListFamilyMembersQueryKey,
  useGetFarmerLocation,
  useDeleteFamilyMember,
  useCreateFamilyMember,
  useDeleteFarmer,
  getListFarmersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Phone, MapPin, Calendar, Trash2, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FarmerDetail() {
  const { id } = useParams<{ id: string }>();
  const farmerId = parseInt(id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", relationship: "", phone: "" });

  const { data: farmer, isLoading: loadingFarmer } = useGetFarmer(farmerId, { query: { enabled: !!farmerId, queryKey: getGetFarmerQueryKey(farmerId) } });
  const { data: family = [], isLoading: loadingFamily } = useListFamilyMembers(farmerId, { query: { enabled: !!farmerId, queryKey: getListFamilyMembersQueryKey(farmerId) } });
  const { data: location } = useGetFarmerLocation(farmerId, { query: { enabled: !!farmerId } });
  const deleteFamilyMember = useDeleteFamilyMember();
  const createFamilyMember = useCreateFamilyMember();
  const deleteFarmer = useDeleteFarmer();

  const handleDeleteMember = (memberId: number) => {
    deleteFamilyMember.mutate({ farmerId, memberId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFamilyMembersQueryKey(farmerId) }),
    });
  };

  const handleAddMember = () => {
    if (!memberForm.name || !memberForm.relationship || !memberForm.phone) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    createFamilyMember.mutate({ farmerId, data: memberForm }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFamilyMembersQueryKey(farmerId) });
        setMemberForm({ name: "", relationship: "", phone: "" });
        setShowAddMember(false);
        toast({ title: "Family member added" });
      },
    });
  };

  const handleDeleteFarmer = () => {
    deleteFarmer.mutate({ id: farmerId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
        navigate("/farmers");
      },
    });
  };

  if (loadingFarmer) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!farmer) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium">Farmer not found</p>
        <Link href="/farmers"><Button variant="link">Back to Registry</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/farmers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Registry
          </Button>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Farmer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {farmer.name}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove the farmer and all associated records.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteFarmer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{farmer.name}</h1>
          <Badge variant="outline" className={farmer.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600"}>
            {farmer.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">{farmer.village}, {farmer.district}, {farmer.state}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{farmer.phone}</span>
            </div>
            {farmer.aadhaar && (
              <div className="text-sm">
                <span className="text-muted-foreground">Aadhaar: </span>{farmer.aadhaar}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Registered {format(new Date(farmer.registeredAt), "dd MMMM yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Last Known Location</CardTitle></CardHeader>
          <CardContent>
            {location ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {format(new Date(location.recordedAt), "dd MMM yyyy, HH:mm")}
                </p>
              </div>
            ) : farmer.lat && farmer.lng ? (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-mono">{farmer.lat.toFixed(4)}, {farmer.lng.toFixed(4)}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Family Members</CardTitle>
            <CardDescription>Emergency contacts and family registered under this farmer.</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddMember(!showAddMember)}>
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddMember && (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <p className="text-sm font-medium">New Family Member</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="Full name" value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Relationship</Label>
                  <Input placeholder="Wife, Son..." value={memberForm.relationship} onChange={e => setMemberForm(p => ({ ...p, relationship: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input placeholder="9876543210" value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddMember} disabled={createFamilyMember.isPending}>
                  {createFamilyMember.isPending ? "Adding..." : "Add"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {loadingFamily ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : family.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No family members registered.</p>
          ) : (
            <div className="space-y-2">
              {family.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="capitalize">{member.relationship}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMember(member.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
