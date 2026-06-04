import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isAuthenticated } = useAuth();

  // if (isLoading) {
  //   return (
  //     <Route path={path}>
  //       <div className="flex items-center justify-center min-h-screen">
  //         <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //       </div>
  //     </Route>
  //   );
  // }

  if (!isAuthenticated) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}