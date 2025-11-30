import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Target,
  TrendingUp,
  RefreshCw,
  Calendar,
  Award,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClassStats {
  class: number;
  subjects: {
    subject: string;
    totalQuestions: number;
    totalStudents: number;
    averageScore: number;
    evaluations: number;
  }[];
}

interface TeacherStats {
  teacherId: string;
  teacherName: string;
  email: string;
  subjectsTaught: { subject: string; class: number }[];
  totalEvaluations: number;
  totalQuestions: number;
  studentsEvaluated: number;
  averageGrade: number;
  lastActivity: string;
}

interface OverallStats {
  totalEvaluations: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  averageScore: number;
  evaluationsToday: number;
  evaluationsThisWeek: number;
  evaluationsThisMonth: number;
}

export default function AdminStats() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  
  // State for different statistics
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalEvaluations: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    averageScore: 0,
    evaluationsToday: 0,
    evaluationsThisWeek: 0,
    evaluationsThisMonth: 0,
  });
  
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  
  // const baseUrl = import.meta.env.VITE_BASE_URL;

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

  // Fetch overall statistics
  const fetchOverallStats = async () => {
    try {
      const response = await apiFetch(`/api/admin/stats/overall?range=${selectedTimeRange}`);
      if (!response.ok) throw new Error("Failed to fetch overall stats");
      const data = await response.json();
      setOverallStats(data);
    } catch (error) {
      console.error("Error fetching overall stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch overall statistics. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch class-wise statistics
  const fetchClassStats = async () => {
    try {
      const response = await apiFetch(`/api/admin/stats/classes?range=${selectedTimeRange}`);
      if (!response.ok) throw new Error("Failed to fetch class stats");
      const data = await response.json();
      setClassStats(data);
    } catch (error) {
      console.error("Error fetching class stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch class statistics. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch teacher-wise statistics
  const fetchTeacherStats = async () => {
    try {
      const response = await apiFetch(`/api/admin/stats/teachers?range=${selectedTimeRange}`);
      if (!response.ok) throw new Error("Failed to fetch teacher stats");
      const data = await response.json();
      setTeacherStats(data);
    } catch (error) {
      console.error("Error fetching teacher stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teacher statistics. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchOverallStats(),
      fetchClassStats(),
      fetchTeacherStats(),
    ]);
    setIsLoading(false);
  };

  // Load data on component mount and time range change
  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchAllData();
    }
  }, [user, selectedTimeRange]);

  const handleRefresh = () => {
    fetchAllData();
    toast({
      title: "Data Refreshed",
      description: "Statistics have been updated successfully.",
    });
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
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Admin Statistics
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive overview of Daily Viva Tracker system</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{overallStats.totalEvaluations.toLocaleString()}</div>
              <p className="text-xs text-gray-600">
                {overallStats.evaluationsToday} today, {overallStats.evaluationsThisWeek} this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overallStats.totalStudents.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Across all classes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{overallStats.totalTeachers}</div>
              <p className="text-xs text-gray-600">Teaching {overallStats.totalSubjects} subjects</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{overallStats.averageScore.toFixed(1)}%</div>
              <p className="text-xs text-gray-600">System-wide performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics Tabs */}
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="classes">Class Statistics</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Statistics</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          </TabsList>

          {/* Class Statistics Tab */}
          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Class & Subject Performance
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of evaluations by class and subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="h-32 bg-gray-100 rounded"></div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {classStats.map((classData) => (
                      <div key={classData.class}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Class {classData.class}
                          <Badge variant="secondary">{classData.subjects.length} subjects</Badge>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {classData.subjects.map((subject) => (
                            <Card key={subject.subject} className="border-l-4 border-l-indigo-400">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-indigo-700">
                                  {subject.subject}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-600">Questions:</span>
                                  <span className="text-xs font-medium">{subject.totalQuestions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-600">Students:</span>
                                  <span className="text-xs font-medium">{subject.totalStudents}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-600">Evaluations:</span>
                                  <span className="text-xs font-medium">{subject.evaluations}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-gray-600">Avg Score:</span>
                                  <Badge variant={subject.averageScore >= 70 ? "default" : subject.averageScore >= 50 ? "secondary" : "destructive"}>
                                    {subject.averageScore.toFixed(1)}%
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teacher Statistics Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teacher Performance Overview
                </CardTitle>
                <CardDescription>
                  Individual teacher statistics and activity metrics
                </CardDescription>
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
                  <div className="space-y-4">
                    {teacherStats.map((teacher) => (
                      <Card key={teacher.teacherId} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {teacher.teacherName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{teacher.teacherName}</h3>
                                <p className="text-sm text-gray-600">{teacher.email}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {teacher.subjectsTaught.slice(0, 3).map((subject, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {subject.subject} (Cl. {subject.class})
                                    </Badge>
                                  ))}
                                  {teacher.subjectsTaught.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{teacher.subjectsTaught.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <div className="text-lg font-bold text-blue-600">{teacher.totalEvaluations}</div>
                                <div className="text-xs text-gray-500">Evaluations</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-600">{teacher.studentsEvaluated}</div>
                                <div className="text-xs text-gray-500">Students</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-purple-600">{teacher.totalQuestions}</div>
                                <div className="text-xs text-gray-500">Questions</div>
                              </div>
                              <div>
                                <Badge variant={teacher.averageGrade >= 70 ? "default" : teacher.averageGrade >= 50 ? "secondary" : "destructive"}>
                                  {teacher.averageGrade.toFixed(1)}%
                                </Badge>
                                <div className="text-xs text-gray-500">Avg Grade</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              Last activity: {new Date(teacher.lastActivity).toLocaleDateString()}
                            </span>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends & Analytics Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trends & Analytics
                </CardTitle>
                <CardDescription>
                  System usage trends and performance analytics (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-600 mb-4">
                    Advanced analytics and trend visualization will be available here.
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}