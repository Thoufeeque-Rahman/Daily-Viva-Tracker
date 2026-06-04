import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { collegeService, College, CreateCollegeData } from "@/lib/college-service";

interface CollegeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  college?: College | null;
}

export default function CollegeFormModal({
  isOpen,
  onClose,
  onSuccess,
  college,
}: CollegeFormModalProps) {
  const [formData, setFormData] = useState<CreateCollegeData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    establishedYear: undefined,
    principalName: "",
    website: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (college) {
      setFormData({
        name: college.name,
        address: college.address,
        phone: college.phone || "",
        email: college.email || "",
        establishedYear: college.establishedYear,
        principalName: college.principalName || "",
        website: college.website || "",
      });
    } else {
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        establishedYear: undefined,
        principalName: "",
        website: "",
      });
    }
  }, [college]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Name and address are required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      if (college) {
        await collegeService.updateCollege(college._id, formData);
        toast({
          title: "Success",
          description: "College updated successfully",
        });
      } else {
        await collegeService.createCollege(formData);
        toast({
          title: "Success",
          description: "College created successfully",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving college:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save college",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof CreateCollegeData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {college ? "Edit College" : "Create New College"}
          </DialogTitle>
          <DialogDescription>
            {college 
              ? "Update the college information below." 
              : "Enter the details to create a new college."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">College Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter college name"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={formData.establishedYear || ""}
                  onChange={(e) => handleChange("establishedYear", parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 1950"
                  disabled={isLoading}
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Enter complete address"
                disabled={isLoading}
                required
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="admin@college.edu"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="principalName">Principal Name</Label>
                <Input
                  id="principalName"
                  value={formData.principalName}
                  onChange={(e) => handleChange("principalName", e.target.value)}
                  placeholder="Dr. John Doe"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.college.edu"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : (college ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}