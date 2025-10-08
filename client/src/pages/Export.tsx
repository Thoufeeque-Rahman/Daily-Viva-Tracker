import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, Calendar, Users, BookOpen, Hash } from "lucide-react";

interface ExportOptions {
  subjects: string[];
  classes: number[];
  students: Array<{
    _id: string;
    name: string;
    rollNumber: string;
    adNumber: string;
    class: number;
  }>;
}

export default function Export() {
  const { toast } = useToast();
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    subjects: [],
    classes: [],
    students: []
  });

  const [filters, setFilters] = useState({
    studentId: "",
    subject: "",
    class: "",
    startDate: "",
    endDate: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchExportOptions();
  }, []);

  const fetchExportOptions = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/exports/options`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setExportOptions(data);
      }
    } catch (error) {
      console.error("Error fetching export options:", error);
      toast({
        title: "Error",
        description: "Failed to fetch export options.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (type: string) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.studentId) queryParams.append('studentId', filters.studentId);
      if (filters.subject) queryParams.append('subject', filters.subject);
      if (filters.class) queryParams.append('class', filters.class);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`${baseUrl}/api/exports/${type}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-marks.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Successful",
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} marks exported successfully.`,
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export marks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      studentId: "",
      subject: "",
      class: "",
      startDate: "",
      endDate: ""
    });
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={false} onHomeClick={() => {}} />
      
      <main className="flex-1 p-6">
        <div className="flex justify-start items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">Export Marks</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Export Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select value={filters.studentId} onValueChange={(value) => setFilters({ ...filters, studentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Students</SelectItem>
                    {exportOptions.students.map((student) => (
                      <SelectItem key={student._id} value={student._id}>
                        {student.name} ({student.rollNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={filters.subject} onValueChange={(value) => setFilters({ ...filters, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Subjects</SelectItem>
                    {exportOptions.subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select value={filters.class} onValueChange={(value) => setFilters({ ...filters, class: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {exportOptions.classes.map((classNum) => (
                      <SelectItem key={classNum} value={classNum.toString()}>
                        Class {classNum}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student-wise Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export individual student marks with detailed information including grades, dates, and punishments.
              </p>
              <Button 
                onClick={() => handleExport("student-wise")} 
                disabled={isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Student-wise
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Class-wise Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export aggregated marks for all students in a specific class with performance summaries.
              </p>
              <Button 
                onClick={() => handleExport("class-wise")} 
                disabled={isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Class-wise
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject-wise Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export marks for all students in a specific subject across different classes.
              </p>
              <Button 
                onClick={() => handleExport("subject-wise")} 
                disabled={isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Subject-wise
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date-wise Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Export all marks within a specific date range with detailed timestamps.
              </p>
              <Button 
                onClick={() => handleExport("date-wise")} 
                disabled={isLoading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Date-wise
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}


