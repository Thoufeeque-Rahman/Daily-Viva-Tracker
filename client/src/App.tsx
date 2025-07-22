import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/admin/dashboard";
import History from "@/pages/history";
import Performance from "@/pages/performance";
import Convert2CCE from "@/pages/cnvrt2cce";

function Router() {
  return ( // TODO: Add a loading state
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/performance" component={Performance} />
      <ProtectedRoute path="/cnvrt2cce" component={Convert2CCE} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin/*" component={Dashboard}/>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
