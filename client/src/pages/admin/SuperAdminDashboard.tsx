import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface GradingConfig {
  _id: string;
  name: string;
  levels: string[];
  isActive: boolean;
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
  const [newGradingConfig, setNewGradingConfig] = useState({
    name: "",
    levels: ["Poor", "Good", "Great"],
  });

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
      await axios.post("/api/grading-configs", newGradingConfig);
      toast({
        title: "Success",
        description: "New grading configuration has been created successfully.",
      });
      setNewGradingConfig({ name: "", levels: ["Poor", "Good", "Great"] });
      fetchGradingConfigs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create grading configuration.",
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
        <Header showContext={false} onHomeClick={() => {}} />
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

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => {}} />
      <main className="relative h-full">
        <div className="flex-1 p-6">
          <div className="flex justify-start items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">
              Super Admin Dashboard
            </h1>
          </div>

          <Tabs defaultValue="teachers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="teachers">Teachers</TabsTrigger>
              <TabsTrigger value="semesters" disabled>
                Semesters
              </TabsTrigger>
              <TabsTrigger value="subjects" disabled>
                Subjects
              </TabsTrigger>
              <TabsTrigger value="grading" disabled>
                Grading
              </TabsTrigger>
            </TabsList>

            {/* Teachers Tab */}
            <TabsContent value="teachers" className="space-y-6">
              {/* <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Create New Teacher
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher-name">Name</Label>
                      <Input
                        id="teacher-name"
                        value={newTeacher.name}
                        onChange={(e) =>
                          setNewTeacher({ ...newTeacher, name: e.target.value })
                        }
                        placeholder="Teacher name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-email">Email</Label>
                      <Input
                        id="teacher-email"
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            email: e.target.value,
                          })
                        }
                        placeholder="teacher@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-phone">Phone</Label>
                      <Input
                        id="teacher-phone"
                        value={newTeacher.phone}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher-password">Password</Label>
                      <Input
                        id="teacher-password"
                        type="password"
                        value={newTeacher.password}
                        onChange={(e) =>
                          setNewTeacher({
                            ...newTeacher,
                            password: e.target.value,
                          })
                        }
                        placeholder="Password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-qualification">Qualification</Label>
                    <Textarea
                      id="teacher-qualification"
                      value={newTeacher.qualification}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          qualification: e.target.value,
                        })
                      }
                      placeholder="Educational qualifications..."
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleCreateTeacher} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Teacher
                  </Button>
                </CardContent>
              </Card> */}

              <Card>
                <CardHeader>
                  <CardTitle>Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="/admin/teachers">teachers</a>
                  <div className="space-y-2">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        onClick={() => {
                          if (teacher._id) {
                            console.log("Navigating to teacher:", teacher._id);
                            navigate(`/admin/teachers/${teacher._id}`);
                          } else {
                            console.error("Missing teacher ID");
                            toast({
                              title: "Error",
                              description: "Teacher ID is missing",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <h3 className="font-medium">{teacher.name}</h3>
                          <p className="text-sm text-gray-600">
                            {teacher.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              teacher.role === "super_admin"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {teacher.role === "super_admin"
                              ? "Super Admin"
                              : "Teacher"}
                          </Badge>
                          <Badge
                            variant={teacher.active ? "default" : "secondary"}
                          >
                            {teacher.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Semesters Tab */}
            <TabsContent value="semesters" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Create New Semester
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester-name">Semester Name</Label>
                      <Input
                        id="semester-name"
                        value={newSemester.name}
                        onChange={(e) =>
                          setNewSemester({
                            ...newSemester,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Spring 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newSemester.startDate}
                        onChange={(e) =>
                          setNewSemester({
                            ...newSemester,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newSemester.endDate}
                        onChange={(e) =>
                          setNewSemester({
                            ...newSemester,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateSemester} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Semester
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Semesters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {semesters.map((semester) => (
                      <div
                        key={semester._id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <h3 className="font-medium">{semester.name}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(semester.startDate).toLocaleDateString()}{" "}
                            - {new Date(semester.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              semester.isActive ? "default" : "secondary"
                            }
                          >
                            {semester.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {!semester.isActive && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleActivateSemester(semester._id)
                              }
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Create New Subject
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input
                      id="subject-name"
                      value={newSubject.name}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, name: e.target.value })
                      }
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject-description">Description</Label>
                    <Textarea
                      id="subject-description"
                      value={newSubject.description}
                      onChange={(e) =>
                        setNewSubject({
                          ...newSubject,
                          description: e.target.value,
                        })
                      }
                      placeholder="Subject description..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateSubject} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Subject
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <h3 className="font-medium">{subject.name}</h3>
                          {subject.description && (
                            <p className="text-sm text-gray-600">
                              {subject.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={subject.isActive ? "default" : "secondary"}
                        >
                          {subject.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grading Tab */}
            <TabsContent value="grading" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Create New Grading Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grading-name">Configuration Name</Label>
                    <Input
                      id="grading-name"
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
                  <div className="space-y-2">
                    <Label>Grade Levels</Label>
                    <div className="space-y-2">
                      {newGradingConfig.levels.map((level, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={level}
                            onChange={(e) => {
                              const newLevels = [...newGradingConfig.levels];
                              newLevels[index] = e.target.value;
                              setNewGradingConfig({
                                ...newGradingConfig,
                                levels: newLevels,
                              });
                            }}
                            placeholder={`Level ${index + 1}`}
                          />
                          {newGradingConfig.levels.length > 2 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newLevels =
                                  newGradingConfig.levels.filter(
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
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewGradingConfig({
                          ...newGradingConfig,
                          levels: [...newGradingConfig.levels, ""],
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Level
                    </Button>
                  </div>
                  <Button
                    onClick={handleCreateGradingConfig}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Configuration
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grading Configurations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gradingConfigs.map((config) => (
                      <div
                        key={config._id}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <h3 className="font-medium">{config.name}</h3>
                          <div className="flex gap-1 mt-1">
                            {config.levels.map((level, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={config.isActive ? "default" : "secondary"}
                          >
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {!config.isActive && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleActivateGradingConfig(config._id)
                              }
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
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
