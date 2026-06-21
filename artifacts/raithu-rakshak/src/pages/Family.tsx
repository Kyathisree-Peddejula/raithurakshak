import { useState } from "react";
import { Link } from "wouter";
import { useListFarmers, useListFamilyMembers, getListFamilyMembersQueryKey, useDeleteFamilyMember } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2, Phone, Users, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function FamilyTable({ farmerId, farmerName, search }: { farmerId: number; farmerName: string; search: string }) {
  const { data: members = [], isLoading } = useListFamilyMembers(farmerId, { query: { enabled: true, queryKey: getListFamilyMembersQueryKey(farmerId) } });
  const deleteMember = useDeleteFamilyMember();
  const queryClient = useQueryClient();

  const filtered = members.filter(
    m => m.name.toLowerCase().includes(search.toLowerCase()) || m.relationship.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading || filtered.length === 0) return null;

  return (
    <>
      {filtered.map(member => (
        <TableRow key={member.id}>
          <TableCell className="font-medium">{member.name}</TableCell>
          <TableCell className="capitalize">{member.relationship}</TableCell>
          <TableCell>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />{member.phone}
            </div>
          </TableCell>
          <TableCell>
            <Link href={`/farmers/${farmerId}`}>
              <Button variant="link" size="sm" className="gap-1 p-0 h-auto">
                {farmerName} <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
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
                  <AlertDialogTitle>Remove Family Member</AlertDialogTitle>
                  <AlertDialogDescription>Remove {member.name} from {farmerName}'s family record?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => deleteMember.mutate({ farmerId, memberId: member.id }, {
                      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFamilyMembersQueryKey(farmerId) }),
                    })}
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function Family() {
  const { data: farmers = [], isLoading } = useListFarmers();
  const [search, setSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<string>("all");

  const displayFarmers = selectedFarmer === "all" ? farmers : farmers.filter(f => f.id.toString() === selectedFarmer);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family Management</h1>
          <p className="text-muted-foreground mt-1">View and manage family members across all registered farmers.</p>
        </div>
        <Link href="/farmers">
          <Button className="gap-2">
            <Users className="w-4 h-4" />
            Manage Farmers
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base">All Family Members</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={selectedFarmer} onValueChange={setSelectedFarmer}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filter by farmer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Farmers</SelectItem>
                {farmers.map(f => (
                  <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-6">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayFarmers.map(farmer => (
                  <FamilyTable key={farmer.id} farmerId={farmer.id} farmerName={farmer.name} search={search} />
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && farmers.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>No farmers registered yet.</p>
              <Link href="/farmers/register"><Button variant="link">Register the first farmer</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
