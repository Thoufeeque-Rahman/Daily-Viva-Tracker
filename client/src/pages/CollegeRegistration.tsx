import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-utils";
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
import { Building, User, GraduationCap, Calendar, Phone, Mail, Globe } from "lucide-react";

interface RegistrationData {
  // College info
  collegeName: string;
  collegeAddress: string;
  collegePhone: string;
  collegeEmail: string;
  establishedYear: string;
  principalName: string;
  website: string;
  
  // Admin info
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword: string;
  adminConfirmPassword: string;
  adminQualification: string;
  adminDateOfBirth: string;
}

export default function CollegeRegistration() {
  const [currentTab, setCurrentTab] = useState("college");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<RegistrationData>({
    // College info
    collegeName: "",
    collegeAddress: "",
    collegePhone: "",
    collegeEmail: "",
    establishedYear: "",
    principalName: "",
    website: "",
    
    // Admin info
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    adminConfirmPassword: "",
    adminQualification: "",
    adminDateOfBirth: "",
  });

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await apiFetch('/api/registration/registration-status');
      const data = await response.json();
      setRegistrationEnabled(data.enabled);
    } catch (error) {
      console.error('Error checking registration status:', error);
      toast({
        title: "Error",
        description: "Failed to check registration status",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCollegeInfo = () => {
    if (!formData.collegeName.trim()) {
      toast({
        title: "Validation Error",
        description: "College name is required",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.collegeAddress.trim()) {
      toast({
        title: "Validation Error", 
        description: "College address is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.collegeEmail && !formData.collegeEmail.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateAdminInfo = () => {
    if (!formData.adminName.trim()) {
      toast({
        title: "Validation Error",
        description: "Admin name is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid admin email address",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.adminPassword) {
      toast({
        title: "Validation Error",
        description: "Admin password is required",
        variant: "destructive",
      });
      return false;
    }

    if (formData.adminPassword.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    if (formData.adminPassword !== formData.adminConfirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateCollegeInfo() || !validateAdminInfo()) {
      return;
    }

    try {
      setIsLoading(true);
      
      const registrationData = {
        // College information
        collegeName: formData.collegeName.trim(),
        collegeAddress: formData.collegeAddress.trim(),
        collegePhone: formData.collegePhone.trim() || undefined,
        collegeEmail: formData.collegeEmail.trim() || undefined,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        principalName: formData.principalName.trim() || undefined,
        website: formData.website.trim() || undefined,
        
        // Admin information
        adminName: formData.adminName.trim(),
        adminEmail: formData.adminEmail.trim(),
        adminPhone: formData.adminPhone.trim(),
        adminPassword: formData.adminPassword,
        adminQualification: formData.adminQualification.trim() || undefined,
        adminDateOfBirth: formData.adminDateOfBirth || undefined,
      };

      const response = await apiFetch('/api/registration/register-college', {
        method: 'POST',
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      toast({
        title: "Success!",
        description: "College and admin account created successfully. You are now logged in.",
      });

      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Redirect to dashboard
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create college and admin account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!registrationEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Registration Closed
            </h2>
            <p className="text-gray-600 mb-4">
              Registration is currently disabled. Please contact support for access.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your College Account
          </h1>
          <p className="text-gray-600 mt-2">
            Set up your college and create your admin account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>College Registration</CardTitle>
            <CardDescription>
              Complete both steps to create your college and admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="college" className="gap-2">
                  <Building className="h-4 w-4" />
                  College Info
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-2">
                  <User className="h-4 w-4" />
                  Admin Account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="college" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="collegeName">College Name *</Label>
                    <Input
                      id="collegeName"
                      value={formData.collegeName}
                      onChange={(e) => handleInputChange("collegeName", e.target.value)}
                      placeholder="Enter college name"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="collegeAddress">Address *</Label>
                    <Textarea
                      id="collegeAddress"
                      value={formData.collegeAddress}
                      onChange={(e) => handleInputChange("collegeAddress", e.target.value)}
                      placeholder="Enter complete college address"
                      disabled={isLoading}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collegePhone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="collegePhone"
                        value={formData.collegePhone}
                        onChange={(e) => handleInputChange("collegePhone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collegeEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="collegeEmail"
                        type="email"
                        value={formData.collegeEmail}
                        onChange={(e) => handleInputChange("collegeEmail", e.target.value)}
                        placeholder="admin@college.edu"
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="establishedYear">Established Year</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="establishedYear"
                        type="number"
                        value={formData.establishedYear}
                        onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                        placeholder="e.g., 1950"
                        disabled={isLoading}
                        min="1800"
                        max={new Date().getFullYear()}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="principalName">Principal Name</Label>
                    <Input
                      id="principalName"
                      value={formData.principalName}
                      onChange={(e) => handleInputChange("principalName", e.target.value)}
                      placeholder="Dr. John Doe"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://www.college.edu"
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      if (validateCollegeInfo()) {
                        setCurrentTab("admin");
                      }
                    }}
                    disabled={isLoading}
                  >
                    Next: Admin Account
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Full Name *</Label>
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
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <Input
                      id="adminPhone"
                      value={formData.adminPhone}
                      onChange={(e) => handleInputChange("adminPhone", e.target.value)}
                      placeholder="Enter phone number"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="adminEmail">Email Address *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                      placeholder="Enter your email address"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange("adminPassword", e.target.value)}
                      placeholder="Enter password (min 6 chars)"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminConfirmPassword">Confirm Password *</Label>
                    <Input
                      id="adminConfirmPassword"
                      type="password"
                      value={formData.adminConfirmPassword}
                      onChange={(e) => handleInputChange("adminConfirmPassword", e.target.value)}
                      placeholder="Confirm your password"
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminDateOfBirth">Date of Birth</Label>
                    <DatePicker
                      id="adminDateOfBirth"
                      date={formData.adminDateOfBirth ? new Date(formData.adminDateOfBirth) : undefined}
                      onDateChange={(date) => handleInputChange("adminDateOfBirth", date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Pick date of birth..."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminQualification">Qualification</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                      <Textarea
                        id="adminQualification"
                        value={formData.adminQualification}
                        onChange={(e) => handleInputChange("adminQualification", e.target.value)}
                        placeholder="e.g., M.Sc. Mathematics, B.Ed."
                        disabled={isLoading}
                        rows={2}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentTab("college")}
                    disabled={isLoading}
                  >
                    Back: College Info
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create College & Account"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}