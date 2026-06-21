import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateFarmer, getListFarmersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  aadhaar: z.string().optional(),
  village: z.string().min(1, "Village is required"),
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function FarmerRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createFarmer = useCreateFarmer();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    createFarmer.mutate(
      {
        data: {
          name: data.name,
          phone: data.phone,
          aadhaar: data.aadhaar || undefined,
          village: data.village,
          district: data.district,
          state: data.state,
          lat: data.lat ? parseFloat(data.lat) : undefined,
          lng: data.lng ? parseFloat(data.lng) : undefined,
        },
      },
      {
        onSuccess: (farmer) => {
          queryClient.invalidateQueries({ queryKey: getListFarmersQueryKey() });
          toast({ title: "Farmer registered", description: `${farmer.name} has been successfully registered.` });
          navigate("/farmers");
        },
        onError: () => {
          toast({ title: "Registration failed", description: "Please check the form and try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/farmers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Registry
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register Farmer</h1>
        <p className="text-muted-foreground mt-1">Add a new farmer to the RaithuRakshak safety network.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
            <CardDescription>Basic identification details of the farmer.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Raju Kumar" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number *</Label>
              <Input id="phone" placeholder="9876543210" {...register("phone")} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="aadhaar">Aadhaar Number (Optional)</Label>
              <Input id="aadhaar" placeholder="1234 5678 9012" {...register("aadhaar")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location Information</CardTitle>
            <CardDescription>Where the farmer is based and operates from.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="village">Village / Habitation *</Label>
              <Input id="village" placeholder="Nandyal" {...register("village")} />
              {errors.village && <p className="text-sm text-destructive">{errors.village.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District *</Label>
              <Input id="district" placeholder="Kurnool" {...register("district")} />
              {errors.district && <p className="text-sm text-destructive">{errors.district.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="state">State *</Label>
              <Input id="state" placeholder="Andhra Pradesh" {...register("state")} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">GPS Coordinates (Optional)</CardTitle>
            <CardDescription>Farm field coordinates for precise location tracking.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" placeholder="15.8281" type="number" step="any" {...register("lat")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" placeholder="78.0373" type="number" step="any" {...register("lng")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || createFarmer.isPending} className="gap-2">
            <UserPlus className="w-4 h-4" />
            {createFarmer.isPending ? "Registering..." : "Register Farmer"}
          </Button>
          <Link href="/farmers">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
