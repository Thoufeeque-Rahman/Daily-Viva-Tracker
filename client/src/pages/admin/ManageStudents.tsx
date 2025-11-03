import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  GraduationCap,
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Search,
  RefreshCw,
  Calendar,
  Hash,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";

interface Student {
  _id: string;
  name: string;
  fullName?: string;
  rollNumber: number;
  adNumber: number;
  class: number;
  dateOfBirth?: string;
  createdAt: string;
}

interface BulkImportResult {
  successful: Array<{
    row: number;
    name: string;
    rollNumber: number;
    adNumber: number;
    class: number;
    id: string;
  }>;
  failed: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  total: number;
}

export default function ManageStudents() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult | null>(
    null
  );

  // Form state
  const [newStudent, setNewStudent] = useState({
    name: "",
    fullName: "",
    rollNumber: "",
    adNumber: "",
    class: "",
    dateOfBirth: "",
  });

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

  // Fetch students
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/students");
      setStudents(response.data);
      setFilteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchStudents();
    }
  }, [user]);

  // Get unique classes for filter
  const uniqueClasses =
    students && students.length > 0
      ? [
          ...new Set(
            students
              .map((s) => s.class)
              .filter((c) => c != null && c !== undefined)
          ),
        ].sort((a, b) => a - b)
      : [];

  // Filter students based on search and filters
  useEffect(() => {
    if (!students || students.length === 0) {
      setFilteredStudents([]);
      return;
    }

    let filtered = [...students];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (student) =>
          student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.rollNumber?.toString().includes(searchTerm) ||
          student.adNumber?.toString().includes(searchTerm)
      );
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter(
        (student) =>
          student.class != null && student.class.toString() === classFilter
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, classFilter]);

  // Handle add student
  const handleAddStudent = async () => {
    try {
      if (
        !newStudent.name ||
        !newStudent.rollNumber ||
        !newStudent.adNumber ||
        !newStudent.class
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const studentData = {
        ...newStudent,
        rollNumber: parseInt(newStudent.rollNumber),
        adNumber: parseInt(newStudent.adNumber),
        class: parseInt(newStudent.class),
        fullName: newStudent.fullName || newStudent.name,
      };

      await axios.post("/api/students", studentData);

      toast({
        title: "Success",
        description: "Student has been created successfully.",
      });

      setNewStudent({
        name: "",
        fullName: "",
        rollNumber: "",
        adNumber: "",
        class: "",
        dateOfBirth: "",
      });

      setShowAddDialog(false);
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create student.",
        variant: "destructive",
      });
    }
  };

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get("/api/bulk-import/template/students", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students_template.xlsx");
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
      formData.append("excel", file);

      const response = await axios.post(
        "/api/bulk-import/bulk-import/students",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setImportResults(response.data.results);

      toast({
        title: "Import Completed",
        description: response.data.message,
      });

      // Refresh students list
      fetchStudents();
    } catch (error: any) {
      console.error("Error importing students:", error);
      toast({
        title: "Import Error",
        description:
          error.response?.data?.message || "Failed to import students.",
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

  if (user?.role !== "super_admin") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl bg-white min-h-screen shadow-lg">
      <Header showContext={false} onHomeClick={() => setLocation("/")} />

      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-green-600" />
              Manage Students
            </h1>
            <p className="text-gray-600 mt-1">
              Add, edit, and manage student records
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => fetchStudents()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Create a new student record with the details below.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={newStudent.name}
                        onChange={(e) =>
                          setNewStudent({ ...newStudent, name: e.target.value })
                        }
                        placeholder="Student name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newStudent.fullName}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            fullName: e.target.value,
                          })
                        }
                        placeholder="Full legal name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber">Roll Number *</Label>
                      <Input
                        id="rollNumber"
                        type="number"
                        value={newStudent.rollNumber}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            rollNumber: e.target.value,
                          })
                        }
                        placeholder="Roll no."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adNumber">Admission No. *</Label>
                      <Input
                        id="adNumber"
                        type="number"
                        value={newStudent.adNumber}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            adNumber: e.target.value,
                          })
                        }
                        placeholder="Admission no."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class">Class *</Label>
                      <Input
                        id="class"
                        type="number"
                        value={newStudent.class}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            class: e.target.value,
                          })
                        }
                        placeholder="Class"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newStudent.dateOfBirth}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddStudent}>Create Student</Button>
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
              Bulk Import Students
            </CardTitle>
            <CardDescription>
              Import multiple students at once using Excel files. Download the
              template to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleDownloadTemplate}>
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
                    <div className="text-2xl font-bold text-green-600">
                      {importResults.successful.length}
                    </div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResults.failed.length}
                    </div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResults.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                </div>

                {importResults.failed.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-semibold text-red-600 mb-1">
                      Failed Records:
                    </h5>
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
                    placeholder="Search by name, roll number, or admission number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses
                      .filter((classNum) => classNum != null)
                      .map((classNum) => (
                        <SelectItem key={classNum} value={classNum.toString()}>
                          Class {classNum}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Students ({filteredStudents.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center space-x-4 p-4 border rounded"
                  >
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
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
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Roll No.</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Sort students by roll number within each class
                      const sortedStudents = [...filteredStudents].sort((a, b) => {
                        if (classFilter === "all") {
                          // For "All Classes", sort by class first, then by roll number
                          if (a.class !== b.class) {
                            return (a.class || 0) - (b.class || 0);
                          }
                          return (a.rollNumber || 0) - (b.rollNumber || 0);
                        } else {
                          // For specific class, just sort by roll number
                          return (a.rollNumber || 0) - (b.rollNumber || 0);
                        }
                      });
                      
                      return sortedStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {student.name
                                  ? student.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                  : "N/A"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.name || "Unnamed Student"}
                              </div>
                              {student.fullName &&
                                student.fullName !== student.name && (
                                  <div className="text-sm text-gray-500">
                                    {student.fullName}
                                  </div>
                                )}
                              {student.dateOfBirth && (
                                <div className="text-xs text-gray-400 flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(
                                    student.dateOfBirth
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center"
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            Class {student.class || "N/A"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center text-sm font-medium">
                            <Hash className="h-3 w-3 mr-1 text-gray-400" />
                            {student.rollNumber || "N/A"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm font-mono text-gray-600">
                            {student.adNumber || "N/A"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
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
                                  <AlertDialogTitle>
                                    Delete Student
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    {student.name}? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                    })()}
                  </TableBody>
                </Table>

                {filteredStudents.length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No students found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || classFilter !== "all"
                        ? "Try adjusting your search or filters."
                        : "Get started by adding your first student."}
                    </p>
                    {!searchTerm && classFilter === "all" && (
                      <Button onClick={() => setShowAddDialog(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Student
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
