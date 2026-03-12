import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-utils";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowUpDown, ChartBar, RefreshCw, SquareChartGantt, Target } from "lucide-react";
import { getPerformanceColors } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { Assignment, Student } from "@/types";

interface StudentPerformance {
  student: Student;
  totalAssignments: number;
  obtainedMarks: number;
  possibleMarks: number;
  percentage: number;
}

type SortField = "rollNumber" | "adNumber" | "percentage" | "name" | "totalAssignments";
type SortDirection = "asc" | "desc";

export default function Assignment2CCE() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [sortField, setSortField] = useState<SortField>("rollNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [totalCceMark, setTotalCceMark] = useState<number | "">(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!selectedSubject) return;

    try {
      const [subject, classStr] = selectedSubject.split("|");
      const classNum = parseInt(classStr, 10);

      const [studentsResponse, assignmentsResponse] = await Promise.all([
        apiFetch(`/api/students/class/${classNum}`),
        apiFetch(`/api/assignments?subject=${encodeURIComponent(subject)}&class=${classNum}`),
      ]);

      if (!studentsResponse.ok || !assignmentsResponse.ok) {
        throw new Error("Failed to fetch assignment conversion data");
      }

      const studentsData = await studentsResponse.json();
      const assignmentsData = await assignmentsResponse.json();

      setStudents(studentsData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assignment data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedSubject || !students.length) {
      setStudentPerformance([]);
      return;
    }

    const allPossible = assignments.reduce((sum, assignment) => sum + (assignment.maxMarks || 0), 0);

    const performance = students.map((student) => {
      const obtained = assignments.reduce((sum, assignment) => {
        const studentMark = (assignment.marks || []).find(
          (mark) => String(mark.studentId) === String(student._id)
        );
        return sum + (studentMark?.mark || 0);
      }, 0);

      const percentage = allPossible > 0 ? (obtained / allPossible) * 100 : 0;

      return {
        student,
        totalAssignments: assignments.length,
        obtainedMarks: obtained,
        possibleMarks: allPossible,
        percentage,
      };
    });

    performance.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "rollNumber":
          comparison = parseInt(String(a.student.rollNumber || 0), 10) - parseInt(String(b.student.rollNumber || 0), 10);
          break;
        case "adNumber":
          comparison = parseInt(String(a.student.adNumber || 0), 10) - parseInt(String(b.student.adNumber || 0), 10);
          break;
        case "percentage":
          comparison = a.percentage - b.percentage;
          break;
        case "name":
          comparison = (a.student.name || "").localeCompare(b.student.name || "");
          break;
        case "totalAssignments":
          comparison = a.totalAssignments - b.totalAssignments;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setStudentPerformance(performance);
  }, [selectedSubject, students, assignments, sortField, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => setLocation("/")} />
      <main className="flex-1 p-6">
        <div className="flex justify-start items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-600">Assignment to CCE</h1>
        </div>

        <div className="flex justify-between items-center mb-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent>
              {user?.subjectsTaught?.map((subjectTaught, index) => (
                <SelectItem
                  key={`${subjectTaught.subject}-${subjectTaught.class}-${index}`}
                  value={`${subjectTaught.subject}|${subjectTaught.class}`}
                >
                  {subjectTaught.subject} (Class {subjectTaught.class})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSubject && studentPerformance.length > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
              <SelectTrigger className="w-40 bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-blue-600 font-medium">Sort by</SelectLabel>
                  <SelectItem value="rollNumber">Serial Number</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="adNumber">Admission Number</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="totalAssignments">Assignments</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortDirection}
              className="bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortDirection === "asc" ? "Asc" : "Desc"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              loading={isRefreshing}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="totalCceMark" className="text-blue-600 font-medium w-full">
                Total CCE Mark:
              </label>
              <input
                id="totalCceMark"
                type="number"
                min={1}
                value={totalCceMark}
                onChange={(e) => {
                  const value = e.target.value;
                  setTotalCceMark(value === "" ? "" : Number(value));
                }}
                className="w-full px-2 py-1 border border-blue-600 rounded focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          {studentPerformance.map((performance) => {
            const colors = getPerformanceColors(performance.percentage);
            return (
              <Card
                key={performance.student._id}
                className={`w-full max-w-md mx-auto border-0 shadow-xl overflow-hidden ${colors.card}`}
              >
                <div className={`px-4 py-3 ${colors.header}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1 text-start">
                        <span className="text-white/80 text-xs font-normal">
                          Sl. #{performance.student.rollNumber}
                        </span>
                        <span className="text-white/80 text-xs font-normal">
                          Ad. {performance.student.adNumber}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white leading-tight">
                          {performance.student.name}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-4 space-y-2">
                  <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Target className={`w-4 h-4 ${colors.icon}`} />
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks</p>
                        </div>
                        <p className="text-lg font-bold text-gray-800">{performance.totalAssignments}</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <ChartBar className={`w-4 h-4 ${colors.icon}`} />
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Percent</p>
                        </div>
                        <p className={`text-lg font-bold ${colors.text}`}>{performance.percentage.toFixed(1)}%</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <SquareChartGantt className={`w-4 h-4 ${colors.icon}`} />
                          <p className="text-xs text-gray-500 uppercase tracking-wide">CCE Mark</p>
                        </div>
                        <p className={`text-lg font-bold ${colors.text}`}>
                          {((performance.percentage * (Number(totalCceMark) || 0)) / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {selectedSubject && studentPerformance.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No assignment data found for this subject
          </p>
        )}

        {!selectedSubject && (
          <p className="text-center text-gray-500 py-8">
            Select a subject to view assignment conversion
          </p>
        )}
      </main>
    </div>
  );
}
