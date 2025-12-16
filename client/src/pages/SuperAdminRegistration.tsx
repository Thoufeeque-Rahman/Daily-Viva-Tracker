import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Building, 
  User, 
  GraduationCap, 
  Calendar, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "@/lib/axios";

interface SuperAdminRegistrationData {
  // Super Admin info
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  adminConfirmPassword: string;
  adminQualification: string;
  adminDateOfBirth: string;
  
  // College info
  collegeName: string;
  collegeAddress: string;
  collegePhone: string;
  collegeEmail: string;
  establishedYear: string;
  principalName: string;
  website: string;
}

export default function SuperAdminRegistration() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState("admin");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<SuperAdminRegistrationData>({
    // Super Admin info
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    adminConfirmPassword: "",
    adminQualification: "",
    adminDateOfBirth: "",
    
    // College info
    collegeName: "",
    collegeAddress: "",
    collegePhone: "",
    collegeEmail: "",
    establishedYear: "",
    principalName: "",
    website: "",
  });

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setIsCheckingToken(false);
        return;
      }

      try {
        console.log('Validating token:', token);
        console.log('Backend URL:', import.meta.env.VITE_BASE_URL);
        const response = await axios.get(`/api/super-admin-registration/validate-token/${token}`);
        const data = response.data;
        console.log('Token validation response:', data);
        
        if (data.valid) {
          setTokenValid(true);
          setTokenInfo(data);
        } else {
          setTokenValid(false);
          toast({
            title: "Invalid Registration Link",
            description: data.error || "This registration link is invalid or expired",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Token validation error:', error);
        console.error('Error details:', error.response?.data);
        setTokenValid(false);
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to validate registration link",
          variant: "destructive",
        });
      } finally {
        setIsCheckingToken(false);
      }
    };

    validateToken();
  }, [token, toast]);

  const handleInputChange = (field: keyof SuperAdminRegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    const { adminName, adminEmail, adminPassword, adminConfirmPassword } = formData;
    
    if (!adminName || !adminEmail || !adminPassword) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields (marked with *)",
        variant: "destructive",
      });
      return false;
    }

    if (adminPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    if (adminPassword !== adminConfirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const { collegeName, collegeAddress } = formData;
    
    if (!collegeName || !collegeAddress) {
      toast({
        title: "Missing Fields",
        description: "Please fill in college name and address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === "admin" && validateStep1()) {
      setCurrentStep("college");
    }
  };

  const handleBack = () => {
    if (currentStep === "college") {
      setCurrentStep("admin");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep === "admin") {
      handleNext();
      return;
    }

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting registration for token:', token);
      console.log('Form data:', formData);
      const response = await axios.post(`/api/super-admin-registration/register-super-admin/${token}`, formData);
      const data = response.data;
      console.log('Registration response:', data);

      if (data.success) {
        toast({
          title: "Registration Successful!",
          description: "Your super admin account and college have been created successfully.",
        });

        // Auto-login is handled by the server (JWT token in cookie)
        // Redirect to dashboard
        setTimeout(() => {
          setLocation("/");
        }, 2000);
      } else {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: "Registration Failed",
        description: error.response?.data?.error || "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while checking token
  if (isCheckingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              Validating Registration Link
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your registration token...
            </p>
          </div>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4 mx-auto">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Invalid Registration Link</CardTitle>
            <CardDescription>
              This registration link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              onClick={() => setLocation("/auth")} 
              className="w-full"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Super Admin Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Create your super admin account and college
          </p>
        </div>

        {/* Token Info Alert */}
        {tokenInfo && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Registration link is valid. {tokenInfo.usesRemaining} use(s) remaining.
              Expires: {new Date(tokenInfo.expiresAt).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <Tabs value={currentStep} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Super Admin
                </TabsTrigger>
                <TabsTrigger value="college" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  College Details
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent>
              <Tabs value={currentStep} className="w-full">
                {/* Step 1: Super Admin Information */}
                <TabsContent value="admin" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="adminName"
                        value={formData.adminName}
                        onChange={(e) => handleInputChange("adminName", e.target.value)}
                        placeholder="Enter your full name"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                        placeholder="admin@college.edu"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="adminPhone"
                        value={formData.adminPhone}
                        onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                        placeholder="+1234567890"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminQualification" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Qualification
                      </Label>
                      <Input
                        id="adminQualification"
                        value={formData.adminQualification}
                        onChange={(e) => handleInputChange("adminQualification", e.target.value)}
                        placeholder="M.Ed, Ph.D, etc."
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPassword" className="flex items-center gap-2">
                        Password * (min 6 characters)
                      </Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={formData.adminPassword}
                        onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                        placeholder="Enter password"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminConfirmPassword">
                        Confirm Password *
                      </Label>
                      <Input
                        id="adminConfirmPassword"
                        type="password"
                        value={formData.adminConfirmPassword}
                        onChange={(e) => handleInputChange("adminConfirmPassword", e.target.value)}
                        placeholder="Confirm password"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="adminDateOfBirth" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                      </Label>
                      <DatePicker
                        id="adminDateOfBirth"
                        date={formData.adminDateOfBirth ? new Date(formData.adminDateOfBirth) : undefined}
                        onDateChange={(date) => handleInputChange("adminDateOfBirth", date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Pick date of birth..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Step 2: College Information */}
                <TabsContent value="college" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="collegeName" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        College Name *
                      </Label>
                      <Input
                        id="collegeName"
                        value={formData.collegeName}
                        onChange={(e) => handleInputChange("collegeName", e.target.value)}
                        placeholder="Enter college name"
                        disabled={isLoading}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="collegeAddress">
                        Address *
                      </Label>
                      <Textarea
                        id="collegeAddress"
                        value={formData.collegeAddress}
                        onChange={(e) => handleInputChange("collegeAddress", e.target.value)}
                        placeholder="Enter complete address"
                        disabled={isLoading}
                        required
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collegePhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        College Phone
                      </Label>
                      <Input
                        id="collegePhone"
                        value={formData.collegePhone}
                        onChange={(e) => handleInputChange("collegePhone", e.target.value)}
                        placeholder="+1234567890"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="collegeEmail" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        College Email
                      </Label>
                      <Input
                        id="collegeEmail"
                        type="email"
                        value={formData.collegeEmail}
                        onChange={(e) => handleInputChange("collegeEmail", e.target.value)}
                        placeholder="info@college.edu"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="establishedYear" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Established Year
                      </Label>
                      <Input
                        id="establishedYear"
                        type="number"
                        value={formData.establishedYear}
                        onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                        placeholder="2020"
                        disabled={isLoading}
                        min="1800"
                        max={new Date().getFullYear()}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principalName">
                        Principal Name
                      </Label>
                      <Input
                        id="principalName"
                        value={formData.principalName}
                        onChange={(e) => handleInputChange("principalName", e.target.value)}
                        placeholder="Dr. Principal Name"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="www.college.edu"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between">
              {currentStep === "college" && (
                <Button type="button" onClick={handleBack} variant="outline" disabled={isLoading}>
                  Back
                </Button>
              )}
              
              <div className="ml-auto">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    "Creating..."
                  ) : currentStep === "admin" ? (
                    "Next: College Details"
                  ) : (
                    "Create Super Admin Account"
                  )}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 This is a secure one-time registration link.</p>
          <p>Your super admin account will have full control over the college system.</p>
        </div>
      </div>
    </div>
  );
}