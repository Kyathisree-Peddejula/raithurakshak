import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Farmers from "@/pages/Farmers";
import FarmerRegister from "@/pages/FarmerRegister";
import FarmerDetail from "@/pages/FarmerDetail";
import Family from "@/pages/Family";
import Weather from "@/pages/Weather";
import LightningAlerts from "@/pages/LightningAlerts";
import EmergencyAlerts from "@/pages/EmergencyAlerts";
import Locations from "@/pages/Locations";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/farmers/register" component={FarmerRegister} />
        <Route path="/farmers/:id" component={FarmerDetail} />
        <Route path="/farmers" component={Farmers} />
        <Route path="/family" component={Family} />
        <Route path="/weather" component={Weather} />
        <Route path="/alerts/lightning" component={LightningAlerts} />
        <Route path="/alerts/emergency" component={EmergencyAlerts} />
        <Route path="/locations" component={Locations} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
