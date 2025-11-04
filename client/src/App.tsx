import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { SuperAdminRoute } from "./lib/super-admin-route";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "./pages/admin/dashboard";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import History from "@/pages/history";
import Performance from "@/pages/performance";
import Convert2CCE from "@/pages/cnvrt2cce";
import Export from "@/pages/Export";
import Profile from "@/pages/Profile";
import TeacherList from "@/pages/admin/TeacherList";
import TeacherDetails from "@/pages/admin/TeacherDetails";
import GradingConfig from "@/pages/admin/GradingConfig";
import AdminStats from "@/pages/admin/AdminStats";
import ManageTeachers from "@/pages/admin/ManageTeachers";
import ManageStudents from "@/pages/admin/ManageStudents";

function Router() {
  return ( // TODO: Add a loading state
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <SuperAdminRoute path="/admin/teachers/:id" component={TeacherDetails} />
      <SuperAdminRoute path="/admin/teachers" component={ManageTeachers} />
      <SuperAdminRoute path="/admin/students" component={ManageStudents} />
      <SuperAdminRoute path="/admin/superadmin" component={SuperAdminDashboard} />
      <SuperAdminRoute path="/admin/stats" component={AdminStats} />
      <SuperAdminRoute path="/admin/grading" component={GradingConfig} />
      <SuperAdminRoute path="/admin/*" component={Dashboard} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/history" component={History} />
      <ProtectedRoute path="/performance" component={Performance} />
      <ProtectedRoute path="/cnvrt2cce" component={Convert2CCE} />
      <ProtectedRoute path="/export" component={Export} />
      <ProtectedRoute path="/profile" component={Profile} />
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
