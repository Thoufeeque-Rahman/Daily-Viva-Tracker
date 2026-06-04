import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Hash, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();
  const { user, isAuthenticated, login, isLoading, isLoginLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // Show stunning splash screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Daily Viva Tracker
            </h1>
            <p className="text-gray-600">
              A tool for managing student evaluations!
            </p>
          </div>
          {/* <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div> */}
        </div>
      </div>
    );
  }

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-8">
      <div className="w-full max-w-md space-y-4">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-2 shadow-md">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-700">DV Staff Login</h1>
          {/* <p className="text-gray-500 mt-1">Sign in to manage student evaluations</p> */}
        </div>

        {/* Auth Card */}
        <Card className="bg-white rounded-3xl shadow-2xl px-8 py-6">
          {/* <CardHeader className="px-6 pt-6 pb-0">
            <CardTitle className="text-start mb-0">
              <h2 className="text-xl font-bold text-blue-700 mb-2 sm:mb-0">Staff Login</h2>
            </CardTitle>
          </CardHeader> */}

          <form onSubmit={handleSubmit} className="p-0">
            <CardContent className="space-y-4 pb-0 p-0">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs uppercase text-sky-600 tracking-wider font-bold">
                  Email Address
                </Label>
                <div className="relative font-medium">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                    <Hash className="h-4 w-4" />
                  </span>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your Email ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoginLoading}
                    required
                    className="h-12 pl-11 rounded-2xl border-2 bg-sky-50 placeholder:text-gray-300 placeholder:text-sm focus:ring-2 focus:ring-sky-300 focus:ring-offset-0 focus-visible:ring-sky-300 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs uppercase text-sky-600 tracking-wider font-bold">
                  Portal Password
                </Label>
                <div className="relative font-medium">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                    <Lock className="h-4 w-4" />
                  </span>

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoginLoading}
                    required
                    className="h-12 pl-11 pr-12 border-2 rounded-2xl bg-sky-50 placeholder:text-gray-300 placeholder:text-sm focus:ring-2 focus:ring-sky-300 focus:ring-offset-0 focus-visible:ring-sky-300 focus-visible:ring-offset-0"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-400"
                    disabled={isLoginLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-6 pt-6 pb-0">
              <Button
                type="submit"
                className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg flex items-center justify-center gap-3"
                loading={isLoginLoading}
              >
                {isLoginLoading ? "Signing in..." : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
