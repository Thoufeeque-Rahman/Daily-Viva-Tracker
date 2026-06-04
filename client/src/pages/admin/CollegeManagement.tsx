import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { collegeService, College, CollegeStats } from "@/lib/college-service";
import CollegeFormModal from "@/components/CollegeFormModal";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  GraduationCap,
  ClipboardList,
  Phone,
  Mail,
  Globe,
  User,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

export default function CollegeManagement() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [collegeStats, setCollegeStats] = useState<Record<string, CollegeStats>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadColleges();
  }, []);

  useEffect(() => {
    const filtered = colleges.filter(college =>
      college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      college.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredColleges(filtered);
  }, [colleges, searchTerm]);

  const loadColleges = async () => {
    try {
      setIsLoading(true);
      const data = await collegeService.getAllColleges();
      setColleges(data);
      
      // Load stats for each college
      const statsPromises = data.map(college => 
        collegeService.getCollegeStats(college._id).catch(error => {
          console.error(`Failed to load stats for college ${college._id}:`, error);
          return null;
        })
      );
      const stats = await Promise.all(statsPromises);
      
      const statsMap: Record<string, CollegeStats> = {};
      data.forEach((college, index) => {
        if (stats[index]) {
          statsMap[college._id] = stats[index];
        }
      });
      setCollegeStats(statsMap);
      
    } catch (error: any) {
      console.error("Error loading colleges:", error);
      toast({
        title: "Error",
        description: "Failed to load colleges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollege = () => {
    setEditingCollege(null);
    setIsFormModalOpen(true);
  };

  const handleEditCollege = (college: College) => {
    setEditingCollege(college);
    setIsFormModalOpen(true);
  };

  const handleDeleteCollege = async (college: College) => {
    try {
      await collegeService.deleteCollege(college._id);
      toast({
        title: "Success",
        description: "College deleted successfully",
      });
      loadColleges();
    } catch (error: any) {
      console.error("Error deleting college:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete college",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    loadColleges();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">College Management</h1>
            <p className="text-gray-500 mt-1">Manage colleges in the system</p>
          </div>
        </div>
        
        <div className="grid gap-6">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building className="h-8 w-8 text-primary" />
            College Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage college in the system
          </p>
        </div>
        
        {/* <Button onClick={handleCreateCollege} className="gap-2">
          <Plus className="h-4 w-4" />
          Add College
        </Button> */}
      </div> 

      {/* Search */}
      {/* <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search colleges by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card> */}

      {/* Stats Overview */}
      {colleges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{colleges.length}</p>
                  <p className="text-sm text-gray-500">Total Colleges</p>
                </div>
              </div>
            </CardContent>
          </Card> */}
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {Object.values(collegeStats).reduce((sum, stat) => sum + stat.totalStudents, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {Object.values(collegeStats).reduce((sum, stat) => sum + stat.totalTeachers, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {Object.values(collegeStats).reduce((sum, stat) => sum + stat.totalEvaluations, 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total Evaluations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Colleges Table */}
      <Card>
        <CardHeader>
          <CardTitle>College</CardTitle>
          {/* <CardDescription>
            {filteredColleges.length} of {colleges.length} colleges
          </CardDescription> */}
        </CardHeader>
        <CardContent>
          {filteredColleges.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No colleges found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No colleges match your search." : "Get started by creating your first college."}
              </p>
              {/* {!searchTerm && (
                <Button onClick={handleCreateCollege} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add College
                </Button>
              )} */}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>College Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColleges.map((college) => (
                  <TableRow key={college._id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{college.name}</div>
                        <div className="text-sm text-gray-500">{college.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {college.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {college.phone}
                          </div>
                        )}
                        {college.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {college.email}
                          </div>
                        )}
                        {college.website && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Globe className="h-3 w-3 mr-1" />
                            <a 
                              href={college.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {college.principalName && (
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3 w-3 mr-1" />
                            {college.principalName}
                          </div>
                        )}
                        {college.establishedYear && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            Est. {college.establishedYear}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {collegeStats[college._id] && (
                        <div className="space-y-1 text-sm">
                          <div>{collegeStats[college._id].totalStudents} students</div>
                          <div>{collegeStats[college._id].totalTeachers} teachers</div>
                          <div>{collegeStats[college._id].totalEvaluations} evaluations</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(college.createdAt), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={college.isActive ? "default" : "secondary"}>
                        {college.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCollege(college)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete College</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{college.name}"? 
                                This action cannot be undone and will affect all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCollege(college)}
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
          )}
        </CardContent>
      </Card>

      {/* College Form Modal */}
      <CollegeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        college={editingCollege}
      />
    </div>
  );
}