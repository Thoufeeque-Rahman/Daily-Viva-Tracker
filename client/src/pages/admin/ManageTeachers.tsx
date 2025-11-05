import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  FileText,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Mail,
  Phone,
  GraduationCap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";
import { BulkDeleteActions, useBulkSelection } from "@/components/BulkDeleteActions";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { SubjectSelector } from "@/components/SubjectSelector";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  qualification?: string;
  dateOfBirth?: string;
  active: boolean;
  joinedAt: string;
  subjectsTaught?: Array<{
    _id: string;
    subject: string;
    class: number;
  }>;
}

interface BulkImportResult {
  successful: Array<{
    row: number;
    name: string;
    email: string;
    id: string;
  }>;
  failed: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  total: number;
}

export default function ManageTeachers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Bulk selection hook
  const {
    selectedItems: selectedTeachers,
    handleSelectAll,
    handleSelectItem,
    clearSelection,
  } = useBulkSelection(filteredTeachers);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult | null>(null);
  
  // Form state
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    qualification: "",
    dateOfBirth: "",
    role: "teacher"
  });

  // Edit form state
  const [editTeacher, setEditTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    dateOfBirth: "",
    role: "teacher"
  });

  // Lesson management state
  const [selectedSubjectForTeacher, setSelectedSubjectForTeacher] = useState("");
  const [teacherClassNumber, setTeacherClassNumber] = useState("");

  // Check if user is super admin
  useEffect(() => {
    if (user && user.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/teachers");
      setTeachers(response.data);
      setFilteredTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teachers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchTeachers();
    }
  }, [user]);

  // Filter teachers based on search and filters
  useEffect(() => {
    if (!teachers || teachers.length === 0) {
      setFilteredTeachers([]);
      return;
    }
    
    let filtered = [...teachers];
    
    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(teacher =>
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone?.includes(searchTerm)
      );
    }
    
    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(teacher => teacher.role === roleFilter);
    }
    
    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter(teacher => teacher.active === isActive);
    }
    
    setFilteredTeachers(filtered);
  }, [teachers, searchTerm, roleFilter, statusFilter]);

  // Handle add teacher
  const handleAddTeacher = async () => {
    try {
      if (!newTeacher.name || !newTeacher.email || !newTeacher.phone || !newTeacher.password) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.post("/api/teachers/register", newTeacher);
      const newTeacherRecord = response.data.teacher; // API returns { message, teacher }
      
      // Add new teacher to local state instead of refetching
      setTeachers(prevTeachers => [...prevTeachers, newTeacherRecord]);
      setFilteredTeachers(prevFiltered => [...prevFiltered, newTeacherRecord]);
      
      toast({
        title: "Success",
        description: "Teacher has been created successfully.",
      });
      
      setNewTeacher({
        name: "",
        email: "",
        phone: "",
        password: "",
        qualification: "",
        dateOfBirth: "",
        role: "teacher"
      });
      
      setShowAddDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create teacher.",
        variant: "destructive",
      });
    }
  };

  // Handle template download
  const handleDownloadTemplate = async (type: "teachers") => {
    try {
      const response = await axios.get(`/api/bulk-import/template/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Template downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk import
  const handleBulkImport = async (file: File) => {
    try {
      setIsImporting(true);
      setImportResults(null);
      
      const formData = new FormData();
      formData.append('excel', file);
      
      const response = await axios.post("/api/bulk-import/bulk-import/teachers", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setImportResults(response.data.results);
      
      toast({
        title: "Import Completed",
        description: response.data.message,
      });
      
      // Refresh teachers list only if there were successful imports
      if (response.data.results.successful.length > 0) {
        fetchTeachers();
      }
    } catch (error: any) {
      console.error("Error importing teachers:", error);
      toast({
        title: "Import Error",
        description: error.response?.data?.message || "Failed to import teachers.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleBulkImport(file);
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    try {
      await axios.delete(`/api/teachers/${teacherId}`);
      
      // Remove teacher from local state instead of refetching
      setTeachers(prevTeachers => prevTeachers.filter(teacher => teacher._id !== teacherId));
      setFilteredTeachers(prevFiltered => prevFiltered.filter(teacher => teacher._id !== teacherId));
      
      toast({
        title: "Success",
        description: `${teacherName} has been deleted successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete teacher.",
        variant: "destructive",
      });
    }
  };

  // Handle bulk delete teachers
  const handleBulkDeleteTeachers = async (teacherIds: string[]) => {
    try {
      await axios.delete("/api/teachers/bulk", {
        data: { teacherIds }
      });
      
      // Refresh the teachers list
      await fetchTeachers();
      
      // Clear selection
      clearSelection();
    } catch (error: any) {
      throw error; // Let BulkDeleteActions handle the error display
    }
  };

  // Handle edit teacher
  const handleEditClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditTeacher({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
      dateOfBirth: teacher.dateOfBirth ? teacher.dateOfBirth.split('T')[0] : "",
      role: teacher.role || "teacher",
    });
    
    // Reset lesson form fields
    setSelectedSubjectForTeacher("");
    setTeacherClassNumber("");
    
    setShowEditDialog(true);
  };

  // Handle update teacher
  const handleUpdateTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      if (!editTeacher.name || !editTeacher.email || !editTeacher.phone) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const response = await axios.put(`/api/teachers/${selectedTeacher._id}`, editTeacher);
      const updatedTeacher = response.data;

      // Update teacher in local state instead of refetching
      setTeachers(prevTeachers => 
        prevTeachers.map(teacher => 
          teacher._id === selectedTeacher._id ? updatedTeacher : teacher
        )
      );
      setFilteredTeachers(prevFiltered => 
        prevFiltered.map(teacher => 
          teacher._id === selectedTeacher._id ? updatedTeacher : teacher
        )
      );

      toast({
        title: "Success",
        description: "Teacher has been updated successfully.",
      });

      setShowEditDialog(false);
      setSelectedTeacher(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update teacher.",
        variant: "destructive",
      });
    }
  };

  // Handle view teacher
  const handleViewClick = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowViewDialog(true);
  };

  // Handle add lesson to teacher
  const handleAddLessonToTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!teacherClassNumber || !selectedSubjectForTeacher || !selectedTeacher) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.post(`/api/teachers/${selectedTeacher._id}/subjects`, {
        class: Number(teacherClassNumber),
        subject: selectedSubjectForTeacher,
      });

      if (response.status === 200 || response.status === 201) {
        // Update the teacher in local state
        const updatedTeacher = response.data;
        setTeachers(prevTeachers => 
          prevTeachers.map(teacher => 
            teacher._id === selectedTeacher._id ? updatedTeacher : teacher
          )
        );
        setFilteredTeachers(prevFiltered => 
          prevFiltered.map(teacher => 
            teacher._id === selectedTeacher._id ? updatedTeacher : teacher
          )
        );
        setSelectedTeacher(updatedTeacher);

        toast({
          title: "Success",
          description: "Lesson added successfully",
        });

        // Reset form
        setTeacherClassNumber("");
        setSelectedSubjectForTeacher("");
      }
    } catch (error) {
      console.error("Add lesson error:", error);
      toast({
        title: "Error",
        description:
          "Failed to add lesson: " +
          ((error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Unknown error"),
        variant: "destructive",
      });
    }
  };

  // Handle remove lesson from teacher
  const handleRemoveLessonFromTeacher = async (subjectId: string) => {
    if (!selectedTeacher) return;

    try {
      const response = await axios.delete(`/api/teachers/${selectedTeacher._id}/subjects/${subjectId}`);

      if (response.status === 200) {
        // Update the teacher in local state
        const updatedTeacher = response.data;
        setTeachers(prevTeachers => 
          prevTeachers.map(teacher => 
            teacher._id === selectedTeacher._id ? updatedTeacher : teacher
          )
        );
        setFilteredTeachers(prevFiltered => 
          prevFiltered.map(teacher => 
            teacher._id === selectedTeacher._id ? updatedTeacher : teacher
          )
        );
        setSelectedTeacher(updatedTeacher);

        toast({
          title: "Success",
          description: "Lesson removed successfully",
        });
      }
    } catch (error) {
      console.error("Remove lesson error:", error);
      toast({
        title: "Error",
        description:
          "Failed to remove lesson: " +
          ((error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Unknown error"),
        variant: "destructive",
      });
    }
  };

  // Show access denied for non-super admins
  if (user && user.role !== "super_admin") {
    return (
      <div className="mx-auto max-w-7xl bg-white min-h-screen shadow-lg">
        <Header showContext={false} onHomeClick={() => setLocation("/")} />
        <main className="p-6">
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the teacher management area.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Only super administrators can manage teachers.
            </p>
            <Button onClick={() => setLocation("/")}>
              Return to Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="mx-auto max-w-7xl bg-white min-h-screen shadow-lg">
        <Header showContext={false} onHomeClick={() => setLocation("/")} />
        <main className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl bg-white min-h-screen shadow-lg">
      <Header showContext={true} onHomeClick={() => setLocation("/")} />
      
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              Manage Teachers
            </h1>
            <p className="text-gray-600 mt-1">Add, edit, and manage teacher accounts</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => fetchTeachers()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Teacher
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Teacher</DialogTitle>
                  <DialogDescription>
                    Create a new teacher account with the details below.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newTeacher.name}
                        onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                        placeholder="teacher@school.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={newTeacher.phone}
                        onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newTeacher.password}
                        onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newTeacher.dateOfBirth}
                        onChange={(e) => setNewTeacher({ ...newTeacher, dateOfBirth: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={newTeacher.role} onValueChange={(value) => setNewTeacher({ ...newTeacher, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualifications</Label>
                    <Textarea
                      id="qualification"
                      value={newTeacher.qualification}
                      onChange={(e) => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
                      placeholder="Educational qualifications and certifications"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTeacher}>
                    Create Teacher
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Bulk Import Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Import Teachers
            </CardTitle>
            <CardDescription>
              Import multiple teachers at once using Excel files. Download the template to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => handleDownloadTemplate("teachers")}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? "Importing..." : "Upload Excel File"}
              </Button>
            </div>
            
            {/* Import Results */}
            {importResults && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Import Results</h4>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResults.successful.length}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResults.failed.length}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResults.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>
                
                {importResults.failed.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-semibold text-red-600 mb-1">Failed Records:</h5>
                    <div className="max-h-32 overflow-y-auto text-xs">
                      {importResults.failed.map((failure, index) => (
                        <div key={index} className="text-red-700">
                          Row {failure.row}: {failure.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Delete Actions */}
        {filteredTeachers.length > 0 && (
          <BulkDeleteActions
            selectedItems={selectedTeachers}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            onBulkDelete={handleBulkDeleteTeachers}
            totalItems={filteredTeachers.length}
            entityName="teachers"
            disabled={isLoading}
          />
        )}

        {/* Teachers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Teachers ({filteredTeachers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                          ref={(el) => {
                            if (el && 'indeterminate' in el) {
                              (el as any).indeterminate = selectedTeachers.length > 0 && selectedTeachers.length < filteredTeachers.length;
                            }
                          }}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTeachers.includes(teacher._id)}
                            onCheckedChange={(checked) => handleSelectItem(teacher._id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {teacher.name ? teacher.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{teacher.name || 'Unnamed Teacher'}</div>
                              {teacher.qualification && (
                                <div className="text-sm text-gray-500 flex items-center">
                                  <GraduationCap className="h-3 w-3 mr-1" />
                                  {teacher.qualification.substring(0, 30)}
                                  {teacher.qualification.length > 30 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {teacher.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {teacher.phone}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={teacher.role === "super_admin" ? "destructive" : "default"}>
                            {teacher.role === "super_admin" ? "Super Admin" : "Teacher"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant={teacher.active ? "default" : "secondary"}>
                            {teacher.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(teacher.joinedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewClick(teacher)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditClick(teacher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {teacher.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTeacher(teacher._id, teacher.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredTeachers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || roleFilter !== "all" || statusFilter !== "all" 
                        ? "Try adjusting your search or filters." 
                        : "Get started by adding your first teacher."
                      }
                    </p>
                    {!searchTerm && roleFilter === "all" && statusFilter === "all" && (
                      <Button onClick={() => setShowAddDialog(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Teacher
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Teacher Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>
                Update teacher information and manage lessons.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Teacher Info</TabsTrigger>
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-6">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input
                        id="edit-name"
                        value={editTeacher.name}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, name: e.target.value })
                        }
                        placeholder="Teacher name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editTeacher.email}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, email: e.target.value })
                        }
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Phone *</Label>
                      <Input
                        id="edit-phone"
                        value={editTeacher.phone}
                        onChange={(e) =>
                          setEditTeacher({ ...editTeacher, phone: e.target.value })
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select
                        value={editTeacher.role}
                        onValueChange={(value) =>
                          setEditTeacher({ ...editTeacher, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-qualification">Qualification</Label>
                    <Textarea
                      id="edit-qualification"
                      value={editTeacher.qualification}
                      onChange={(e) =>
                        setEditTeacher({ ...editTeacher, qualification: e.target.value })
                      }
                      placeholder="Educational qualification"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                    <Input
                      id="edit-dateOfBirth"
                      type="date"
                      value={editTeacher.dateOfBirth}
                      onChange={(e) =>
                        setEditTeacher({ ...editTeacher, dateOfBirth: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTeacher}>Update Teacher</Button>
                </div>
              </TabsContent>

              <TabsContent value="lessons" className="space-y-4 mt-6">
                {selectedTeacher && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">Current Lessons</h3>
                      {selectedTeacher.subjectsTaught && selectedTeacher.subjectsTaught.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Class</TableHead>
                              <TableHead>Lesson</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTeacher.subjectsTaught
                              .sort((a, b) => b.class - a.class)
                              .map((subject: any) => (
                                <TableRow key={subject._id}>
                                  <TableCell>{subject.class}</TableCell>
                                  <TableCell>{subject.subject}</TableCell>
                                  <TableCell>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will remove {subject.subject} for class{" "}
                                            {subject.class} from {selectedTeacher.name}'s lessons. 
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleRemoveLessonFromTeacher(subject._id)}
                                            className="bg-red-500 hover:bg-red-600"
                                          >
                                            Remove
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm">No lessons assigned yet.</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4">Add New Lesson</h3>
                      <form onSubmit={handleAddLessonToTeacher} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="teacher-class">Class</Label>
                            <Input
                              id="teacher-class"
                              type="number"
                              placeholder="Class number (1-10)"
                              value={teacherClassNumber}
                              onChange={(e) => setTeacherClassNumber(e.target.value)}
                              min="1"
                              max="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <SubjectSelector
                              selectedSubject={selectedSubjectForTeacher}
                              onSubjectSelect={setSelectedSubjectForTeacher}
                              label="Lesson"
                              placeholder="Select or add lesson..."
                              showAllSubjects={true}
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Lesson
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* View Teacher Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Teacher Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedTeacher?.name}
              </DialogDescription>
            </DialogHeader>

            {selectedTeacher && (
              <div className="grid gap-4 py-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {selectedTeacher.name
                        ? selectedTeacher.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTeacher.name}</h3>
                    <Badge variant={selectedTeacher.role === "super_admin" ? "destructive" : "default"}>
                      {selectedTeacher.role === "super_admin" ? "Super Admin" : "Teacher"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedTeacher.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedTeacher.phone}</span>
                    </div>
                  </div>
                </div>

                {selectedTeacher.qualification && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Qualification</Label>
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedTeacher.qualification}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <Badge variant={selectedTeacher.active ? "default" : "secondary"}>
                      {selectedTeacher.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {selectedTeacher.dateOfBirth
                          ? new Date(selectedTeacher.dateOfBirth).toLocaleDateString()
                          : "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Joined System</Label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{new Date(selectedTeacher.joinedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowViewDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}