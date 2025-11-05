import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  BookOpen,
  Calendar,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
} from "lucide-react";
import { useLocation } from "wouter";
import CollegeManagement from "./CollegeManagement";

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Subject {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
}

interface Level {
  name: string;
  emoji?: string;
  mark: number;
  color: string;
  description?: string;
}

interface GradingConfig {
  _id: string;
  name: string;
  description?: string;
  levels: Level[];
  isActive: string[] | boolean; // Array of college IDs or legacy boolean
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for different sections
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [gradingConfigs, setGradingConfigs] = useState<GradingConfig[]>([]);

  // Form states
  const [newSemester, setNewSemester] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    qualification: "",
  });
  const [newGradingConfig, setNewGradingConfig] = useState<{
    name: string;
    description?: string;
    levels: Level[];
    isActive: boolean;
  }>({
    name: "",
    description: "",
    levels: [],
    isActive: false,
  });

  // Dialog states
  const [showGradingConfigDialog, setShowGradingConfigDialog] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    if (user?.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch data
  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchSemesters();
      fetchSubjects();
      fetchTeachers();
      fetchGradingConfigs();
    }
  }, [user]);

  const fetchSemesters = async () => {
    try {
      const response = await axios.get("/api/semesters");
      setSemesters(response.data);
    } catch (error) {
      console.error("Error fetching semesters:", error);
      toast({
        title: "Error",
        description: "Failed to fetch semesters.",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get("/api/subjects");
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subjects.",
        variant: "destructive",
      });
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get("/api/teachers");
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teachers.",
        variant: "destructive",
      });
    }
  };

  const fetchGradingConfigs = async () => {
    try {
      const response = await axios.get("/api/grading-configs");
      setGradingConfigs(response.data);
    } catch (error) {
      console.error("Error fetching grading configs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch grading configurations.",
        variant: "destructive",
      });
    }
  };

  // Helper function to check if a grading config is active for current user's college
  const isConfigActiveForUser = (config: GradingConfig): boolean => {
    if (!user?.collegeId) return false;
    
    // Handle legacy boolean format
    if (typeof config.isActive === 'boolean') {
      return config.isActive;
    }
    
    // Handle new array format - check if user's college ID is in the array
    if (Array.isArray(config.isActive)) {
      return config.isActive.includes(user.collegeId);
    }
    
    return false;
  };

  const handleCreateSemester = async () => {
    try {
      await axios.post("/api/semesters", newSemester);
      toast({
        title: "Success",
        description: "New semester has been created successfully.",
      });
      setNewSemester({ name: "", startDate: "", endDate: "" });
      fetchSemesters();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create semester.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubject = async () => {
    try {
      await axios.post("/api/subjects", newSubject);
      toast({
        title: "Success",
        description: "New subject has been created successfully.",
      });
      setNewSubject({ name: "", description: "" });
      fetchSubjects();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create subject.",
        variant: "destructive",
      });
    }
  };

  const handleCreateTeacher = async () => {
    try {
      await axios.post("/api/teachers/register", newTeacher);
      toast({
        title: "Success",
        description: "New teacher has been created successfully.",
      });
      setNewTeacher({
        name: "",
        email: "",
        phone: "",
        password: "",
        qualification: "",
      });
      fetchTeachers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create teacher.",
        variant: "destructive",
      });
    }
  };

  const handleCreateGradingConfig = async () => {
    try {
      if (newGradingConfig.levels.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one level.",
          variant: "destructive",
        });
        return;
      }

      // Validate levels
      const invalidLevel = newGradingConfig.levels.find(
        (level) => !level.name || level.mark === undefined || !level.color
      );
      if (invalidLevel) {
        toast({
          title: "Error",
          description: "Each level must have a name, mark, and color.",
          variant: "destructive",
        });
        return;
      }

      await axios.post("/api/grading-configs", newGradingConfig);
      toast({
        title: "Success",
        description: "New grading configuration has been created successfully.",
      });
      setNewGradingConfig({
        name: "",
        description: "",
        levels: [],
        isActive: false,
      });
      setShowGradingConfigDialog(false);
      fetchGradingConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create grading configuration.",
        variant: "destructive",
      });
    }
  };

  const deleteGradingConfig = async (configId: string) => {
    try {
      await axios.delete(`/api/grading-configs/${configId}`);
      toast({
        title: "Success",
        description: "Grading configuration has been deleted successfully.",
      });
      fetchGradingConfigs();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to delete grading configuration.",
        variant: "destructive",
      });
    }
  };

  const [location, navigate] = useLocation();

  const handleActivateSemester = async (semesterId: string) => {
    try {
      await axios.put(`/api/semesters/${semesterId}/activate`);
      toast({
        title: "Success",
        description: "Semester has been activated successfully.",
      });
      fetchSemesters();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate semester.",
        variant: "destructive",
      });
    }
  };

  const handleActivateGradingConfig = async (configId: string) => {
    try {
      await axios.put(`/api/grading-configs/${configId}/activate`);
      toast({
        title: "Success",
        description: "Grading configuration has been activated successfully.",
      });
      fetchGradingConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate grading configuration.",
        variant: "destructive",
      });
    }
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
        <Header showContext={false} onHomeClick={() => {setLocation('/')}} />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold text-red-600 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to access this page.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const [, setLocation] = useLocation();

  return (
    <div className="mx-auto max-w-7xl bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => {setLocation('/')}} />
      <main className="relative h-full">
        <div className="flex-1 p-6">
          <div className="flex justify-start items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">
              Super Admin Dashboard
            </h1>
          </div>

          <Tabs defaultValue="colleges" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="colleges">College Profile</TabsTrigger>
              {/* <TabsTrigger value="teachers">Teachers</TabsTrigger> */}
              <TabsTrigger value="grading">Grading Configration</TabsTrigger>
              {/* <TabsTrigger value="semesters" disabled>
                Semesters
              </TabsTrigger>
              <TabsTrigger value="subjects" disabled> 
                Subjects
              </TabsTrigger> */}
            </TabsList>

            {/* Colleges Tab */}
            <TabsContent value="colleges" className="space-y-6">
              <CollegeManagement />
            </TabsContent>

            {/* Grading Tab */}
            <TabsContent value="grading" className="space-y-6">
              <Card className="mx-auto max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Grading Configurations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {gradingConfigs.map((config) => (
                      <Card key={config._id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {config.name}
                            </h3>
                            {config.description && (
                              <p className="text-gray-500 mt-1">
                                {config.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`active-${config._id}`}>
                                Active
                              </Label>
                              <Switch
                                id={`active-${config._id}`}
                                checked={isConfigActiveForUser(config)}
                                onCheckedChange={(checked) =>
                                  handleActivateGradingConfig(config._id)
                                }
                              />
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteGradingConfig(config._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Level</TableHead>
                              <TableHead>Emoji</TableHead>
                              <TableHead>Mark</TableHead>
                              <TableHead>Color</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {config.levels.map((level, index) => (
                              <TableRow key={index}>
                                <TableCell>{level.name}</TableCell>
                                <TableCell>{level.emoji}</TableCell>
                                <TableCell>{level.mark}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded border"
                                      style={{ backgroundColor: level.color }}
                                    />
                                    {level.color}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    ))}
                    <Dialog open={showGradingConfigDialog} onOpenChange={setShowGradingConfigDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Grading Configuration
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Create New Grading Configuration
                          </DialogTitle>
                          <DialogDescription>
                            Create a new grading template with custom levels, marks, and colors.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-6">
                          <div>
                            <Label htmlFor="dialog-grading-name">Template Name</Label>
                            <Input
                              id="dialog-grading-name"
                              value={newGradingConfig.name}
                              onChange={(e) =>
                                setNewGradingConfig({
                                  ...newGradingConfig,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., Standard Grading"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dialog-description">Description</Label>
                            <Textarea
                              id="dialog-description"
                              value={newGradingConfig.description || ""}
                              onChange={(e) =>
                                setNewGradingConfig({
                                  ...newGradingConfig,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Template description..."
                            />
                          </div>
                          <div>
                            <Label>Levels</Label>
                            <div className="space-y-2 mt-2">
                              {newGradingConfig.levels.map((level, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-2 border rounded-lg"
                                >
                                  <div className="flex-1 flex flex-wrap gap-2">
                                    <div className="w-20">
                                      <Label>Emoji</Label>
                                      <Input
                                        value={level.emoji}
                                        onChange={(e) => {
                                          const newLevels = [
                                            ...newGradingConfig.levels,
                                          ];
                                          newLevels[index] = {
                                            ...newLevels[index],
                                            emoji: e.target.value,
                                          };
                                          setNewGradingConfig({
                                            ...newGradingConfig,
                                            levels: newLevels,
                                          });
                                        }}
                                        placeholder="e.g., 🙂"
                                      />
                                    </div>
                                    <div className="col-span-3">
                                      <Label>Name</Label>
                                      <Input
                                        value={level.name}
                                        onChange={(e) => {
                                          const newLevels = [
                                            ...newGradingConfig.levels,
                                          ];
                                          newLevels[index] = {
                                            ...newLevels[index],
                                            name: e.target.value,
                                          };
                                          setNewGradingConfig({
                                            ...newGradingConfig,
                                            levels: newLevels,
                                          });
                                        }}
                                        placeholder="e.g., Excellent"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <Label>Mark</Label>
                                      <Input
                                        type="number"
                                        value={level.mark}
                                        className="w-12 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none appearance-none"
                                        onChange={(e) => {
                                          const newLevels = [
                                            ...newGradingConfig.levels,
                                          ];
                                          newLevels[index] = {
                                            ...newLevels[index],
                                            mark: Number(e.target.value),
                                          };
                                          setNewGradingConfig({
                                            ...newGradingConfig,
                                            levels: newLevels,
                                          });
                                        }}
                                        placeholder="0-100"
                                      />
                                    </div>
                                    <div className="col-span-5">
                                      <Label>Color</Label>
                                      <div className="flex gap-2">
                                        <Input
                                          type="color"
                                          value={level.color}
                                          onChange={(e) => {
                                            const newLevels = [
                                              ...newGradingConfig.levels,
                                            ];
                                            newLevels[index] = {
                                              ...newLevels[index],
                                              color: e.target.value,
                                            };
                                            setNewGradingConfig({
                                              ...newGradingConfig,
                                              levels: newLevels,
                                            });
                                          }}
                                          className="w-14"
                                        />
                                        <Input
                                          value={level.color}
                                          className="w-24" 
                                          onChange={(e) => {
                                            const newLevels = [
                                              ...newGradingConfig.levels,
                                            ];
                                            newLevels[index] = {
                                              ...newLevels[index],
                                              color: e.target.value,
                                            };
                                            setNewGradingConfig({
                                              ...newGradingConfig,
                                              levels: newLevels,
                                            });
                                          }}
                                          placeholder="#000000"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newLevels = newGradingConfig.levels.filter(
                                        (_, i) => i !== index
                                      );
                                      setNewGradingConfig({
                                        ...newGradingConfig,
                                        levels: newLevels,
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setNewGradingConfig({
                                    ...newGradingConfig,
                                    levels: [
                                      ...newGradingConfig.levels,
                                      { name: "", mark: 0, color: "#000000" },
                                    ],
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Level
                              </Button>
                            </div>
                          </div>
                          <Button
                            onClick={handleCreateGradingConfig}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
