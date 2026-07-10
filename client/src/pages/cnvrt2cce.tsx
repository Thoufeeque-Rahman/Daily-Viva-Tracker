import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api-utils";
import Header from "@/components/Header";
import * as XLSX from "xlsx";
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
import {
  Target,
  Trophy,
  ArrowUpDown,
  RefreshCw,
  SquareChartGantt,
  Download,
} from "lucide-react";
import { getPerformanceColors } from "@/lib/colors";
import { useToast } from "@/hooks/use-toast";
import { Student, DvtMark, Assignment } from "@/types";
import { CardSkeleton } from "@/components/SkeletonLoaders";

interface StudentPerformance {
  student: Student;
  totalQuestions: number;
  totalScore: number;
  dvPercentage: number;
  dvCceMark: number;
  totalAssignments: number;
  obtainedAssignmentMarks: number;
  totalPossibleAssignmentMarks: number;
  assignmentPercentage: number;
  assignmentCceMark: number;
  combinedCceMark: number;
  maxCombinedCce: number;
  combinedPercentage: number;
}

type SortField =
  | "rollNumber"
  | "adNumber"
  | "combinedPercentage"
  | "name"
  | "totalQuestions"
  | "totalAssignments";
type SortDirection = "asc" | "desc";

export default function Cnvrt2CCE() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [dvtMarks, setDvtMarks] = useState<DvtMark[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [sortField, setSortField] = useState<SortField>("rollNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [totalDvCceMark, setTotalDvCceMark] = useState<number | "">(10);
  const [totalAssignmentCceMark, setTotalAssignmentCceMark] = useState<number | "">(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    if (!selectedSubject) return;

    setIsLoading(true);
    try {
      const [subject, classStr] = selectedSubject.split("|");
      const classNum = parseInt(classStr, 10);

      const [studentsResponse, dvtMarksResponse, assignmentsResponse] = await Promise.all([
        apiFetch(`/api/students/class/${classNum}`),
        apiFetch(`/api/dvtmarks/${encodeURIComponent(subject)}/${classNum}`),
        apiFetch(`/api/assignments?subject=${encodeURIComponent(subject)}&class=${classNum}`),
      ]);

      if (!studentsResponse.ok || !dvtMarksResponse.ok || !assignmentsResponse.ok) {
        throw new Error("Failed to fetch conversion data");
      }

      const studentsData = await studentsResponse.json();
      const dvtMarksData = await dvtMarksResponse.json();
      const assignmentsData = await assignmentsResponse.json();

      setStudents(studentsData || []);
      setDvtMarks(dvtMarksData || []);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Error fetching conversion data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch conversion data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSubject]);

  // Calculate performance metrics when subject, marks, assignments or limits change
  useEffect(() => {
    if (!selectedSubject || !students.length) {
      setStudentPerformance([]);
      return;
    }

    const totalPossibleAssignmentMarks = assignments.reduce(
      (sum, assignment) => sum + (assignment.maxMarks || 0),
      0
    );

    const performance = students.map((student) => {
      // DVT Metrics
      const studentDvtMarks = dvtMarks.filter(
        (mark) => String(mark.studentId) === String(student._id)
      );
      const totalQuestions = studentDvtMarks.length;
      const totalScore = studentDvtMarks.reduce((sum, mark) => sum + mark.mark, 0);
      const dvPercentage = totalQuestions > 0 ? (totalScore / (totalQuestions * 2)) * 100 : 0;
      const dvCceMark = (dvPercentage * (Number(totalDvCceMark) || 0)) / 100;

      // Assignment Metrics
      const obtainedAssignmentMarks = assignments.reduce((sum, assignment) => {
        const studentMark = (assignment.marks || []).find(
          (mark) => String(mark.studentId) === String(student._id)
        );
        return sum + (studentMark?.mark || 0);
      }, 0);
      const assignmentPercentage =
        totalPossibleAssignmentMarks > 0
          ? (obtainedAssignmentMarks / totalPossibleAssignmentMarks) * 100
          : 0;
      const assignmentCceMark =
        (assignmentPercentage * (Number(totalAssignmentCceMark) || 0)) / 100;

      // Combined Metrics
      const combinedCceMark = dvCceMark + assignmentCceMark;
      const maxCombinedCce = (Number(totalDvCceMark) || 0) + (Number(totalAssignmentCceMark) || 0);
      const combinedPercentage = maxCombinedCce > 0 ? (combinedCceMark / maxCombinedCce) * 100 : 0;

      return {
        student,
        totalQuestions,
        totalScore,
        dvPercentage,
        dvCceMark,
        totalAssignments: assignments.length,
        obtainedAssignmentMarks,
        totalPossibleAssignmentMarks,
        assignmentPercentage,
        assignmentCceMark,
        combinedCceMark,
        maxCombinedCce,
        combinedPercentage,
      };
    });

    // Sort based on current sort field and direction
    performance.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "rollNumber":
          comparison =
            parseInt(String(a.student.rollNumber || 0), 10) -
            parseInt(String(b.student.rollNumber || 0), 10);
          break;
        case "adNumber": {
          const numA = parseInt(String(a.student.adNumber || 0), 10);
          const numB = parseInt(String(b.student.adNumber || 0), 10);
          if (isNaN(numA) && isNaN(numB)) {
            comparison = String(a.student.adNumber || "").localeCompare(
              String(b.student.adNumber || "")
            );
          } else if (isNaN(numA)) {
            comparison = 1;
          } else if (isNaN(numB)) {
            comparison = -1;
          } else {
            comparison = numA - numB;
          }
          break;
        }
        case "combinedPercentage":
          comparison = a.combinedPercentage - b.combinedPercentage;
          break;
        case "name":
          comparison = (a.student.name || "").localeCompare(b.student.name || "");
          break;
        case "totalQuestions":
          comparison = a.totalQuestions - b.totalQuestions;
          break;
        case "totalAssignments":
          comparison = a.totalAssignments - b.totalAssignments;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setStudentPerformance(performance);
  }, [
    selectedSubject,
    students,
    dvtMarks,
    assignments,
    sortField,
    sortDirection,
    totalDvCceMark,
    totalAssignmentCceMark,
  ]);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "Successfully refreshed conversion data.",
    });
  };

  const handleDownloadExcel = () => {
    if (!selectedSubject || studentPerformance.length === 0) return;

    const [subject, classStr] = selectedSubject.split("|");
    const classNum = classStr;

    // Sort by Admission Number ascending (numerical-safe order)
    const sortedForDownload = [...studentPerformance].sort((a, b) => {
      const numA = parseInt(String(a.student.adNumber || 0), 10);
      const numB = parseInt(String(b.student.adNumber || 0), 10);
      if (isNaN(numA) && isNaN(numB)) {
        return String(a.student.adNumber || "").localeCompare(String(b.student.adNumber || ""));
      } else if (isNaN(numA)) {
        return 1;
      } else if (isNaN(numB)) {
        return -1;
      } else {
        return numA - numB;
      }
    });

    const headers = [
      "Admission Number",
      "Roll Number",
      "Name",
      "Daily Viva Percentage",
      `Daily Viva CCE (Max: ${totalDvCceMark})`,
      "Assignment Percentage",
      `Assignment CCE (Max: ${totalAssignmentCceMark})`,
      `Total CCE (Max: ${(Number(totalDvCceMark) || 0) + (Number(totalAssignmentCceMark) || 0)})`,
    ];

    const data = sortedForDownload.map((p) => ({
      "Admission Number": p.student.adNumber,
      "Roll Number": p.student.rollNumber,
      "Name": p.student.name,
      "Daily Viva Percentage": `${p.dvPercentage.toFixed(1)}%`,
      [`Daily Viva CCE (Max: ${totalDvCceMark})`]: parseFloat(p.dvCceMark.toFixed(2)),
      "Assignment Percentage": `${p.assignmentPercentage.toFixed(1)}%`,
      [`Assignment CCE (Max: ${totalAssignmentCceMark})`]: parseFloat(p.assignmentCceMark.toFixed(2)),
      [`Total CCE (Max: ${(Number(totalDvCceMark) || 0) + (Number(totalAssignmentCceMark) || 0)})`]: parseFloat(p.combinedCceMark.toFixed(2)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CCE Conversion");
    XLSX.writeFile(workbook, `${subject}_Class_${classNum}_cce_conversion.xlsx`);

    toast({
      title: "Success",
      description: "Marks downloaded successfully as Excel file in admission number order.",
    });
  };

  const handleDownloadPortalExcel = () => {
    if (!selectedSubject || studentPerformance.length === 0) return;

    const [subject, classStr] = selectedSubject.split("|");
    const classNum = classStr;

    // Sort by Admission Number ascending (numerical-safe order)
    const sortedForDownload = [...studentPerformance].sort((a, b) => {
      const numA = parseInt(String(a.student.adNumber || 0), 10);
      const numB = parseInt(String(b.student.adNumber || 0), 10);
      if (isNaN(numA) && isNaN(numB)) {
        return String(a.student.adNumber || "").localeCompare(String(b.student.adNumber || ""));
      } else if (isNaN(numA)) {
        return 1;
      } else if (isNaN(numB)) {
        return -1;
      } else {
        return numA - numB;
      }
    });

    const headers = ["adno", "total mark"];

    const data = sortedForDownload.map((p) => ({
      "adno": p.student.adNumber,
      "total mark": parseFloat(p.combinedCceMark.toFixed(2)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Portal Marks");
    XLSX.writeFile(workbook, `${subject}_Class_${classNum}_portal_format.xlsx`);

    toast({
      title: "Success",
      description: "Portal Excel file downloaded successfully in admission number order.",
    });
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => setLocation("/")} />
      <main className="flex-1 p-6">
        <div className="flex justify-start items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-600">CCE Conversion</h1>
        </div>

        {/* Subject Select */}
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

        {/* Dynamic Parameter Settings */}
        {selectedSubject && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="totalDvCceMark" className="text-xs font-semibold text-blue-600">
                Convert Daily Viva to:
              </label>
              <input
                id="totalDvCceMark"
                type="number"
                min={0}
                value={totalDvCceMark}
                onChange={(e) => {
                  const value = e.target.value;
                  setTotalDvCceMark(value === "" ? "" : Number(value));
                }}
                className="w-full px-3 py-1.5 border border-blue-600 rounded focus:outline-none text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="totalAssignmentCceMark" className="text-xs font-semibold text-blue-600">
                Convert Assignment to:
              </label>
              <input
                id="totalAssignmentCceMark"
                type="number"
                min={0}
                value={totalAssignmentCceMark}
                onChange={(e) => {
                  const value = e.target.value;
                  setTotalAssignmentCceMark(value === "" ? "" : Number(value));
                }}
                className="w-full px-3 py-1.5 border border-blue-600 rounded focus:outline-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Download & Sort Controls */}
        {selectedSubject && studentPerformance.length > 0 && (
          <div className="mb-6 space-y-3">
            <Button
              onClick={handleDownloadExcel}
              className="w-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              Download Converted Marks (Excel)
            </Button>

            <Button
              onClick={handleDownloadPortalExcel}
              className="w-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-4 h-4" />
              Download Portal File (Excel)
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={sortField}
                onValueChange={(value: SortField) => setSortField(value)}
              >
                <SelectTrigger className="w-40 bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="text-blue-600 font-medium">Sort by</SelectLabel>
                    <SelectItem value="rollNumber">Serial Number</SelectItem>
                    <SelectItem value="adNumber">Admission Number</SelectItem>
                    <SelectItem value="combinedPercentage">Combined Percentage</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="totalQuestions">Questions</SelectItem>
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
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        )}

        {/* Student Cards List */}
        <div className="space-y-4">
          {isLoading && selectedSubject ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </>
          ) : (
            studentPerformance.map((performance) => {
              const colors = getPerformanceColors(performance.combinedPercentage);
              return (
                <Card
                  key={performance.student._id}
                  className={`w-full max-w-md mx-auto border-0 shadow-lg overflow-hidden ${colors.card} transition duration-300 hover:scale-[1.01]`}
                >
                  {/* Header Section */}
                  <div className={`px-4 py-3 ${colors.header} flex justify-between items-center text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-0.5 text-start text-[10px] text-white/80">
                        <span>Sl. #{performance.student.rollNumber}</span>
                        <span>Ad. {performance.student.adNumber}</span>
                      </div>
                      <h2 className="text-sm font-bold leading-tight">{performance.student.name}</h2>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="px-3 py-4">
                    <div className="bg-white/95 rounded-xl p-4 shadow-inner grid grid-cols-3 gap-2">
                      {/* Daily Viva Column */}
                      <div className="text-center flex flex-col justify-between border-r border-gray-200 pr-2">
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Target className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Daily Viva</p>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1">Qns: <span className="font-semibold">{performance.totalQuestions}</span></p>
                          <p className="text-[10px] text-gray-600">Pct: <span className="font-semibold">{performance.dvPercentage.toFixed(1)}%</span></p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-[9px] text-gray-400 uppercase tracking-wider">CCE Mark</p>
                          <p className="text-sm font-bold text-blue-700">{performance.dvCceMark.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Assignment Column */}
                      <div className="text-center flex flex-col justify-between border-r border-gray-200 px-1">
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <SquareChartGantt className="w-3.5 h-3.5 text-amber-600" />
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Assignments</p>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1">Tasks: <span className="font-semibold">{performance.totalAssignments}</span></p>
                          <p className="text-[10px] text-gray-600">Pct: <span className="font-semibold">{performance.assignmentPercentage.toFixed(1)}%</span></p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-[9px] text-gray-400 uppercase tracking-wider">CCE Mark</p>
                          <p className="text-sm font-bold text-amber-700">{performance.assignmentCceMark.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Combined CCE Column */}
                      <div className="text-center flex flex-col justify-between pl-2">
                        <div>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Trophy className={`w-3.5 h-3.5 ${colors.icon}`} />
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total CCE</p>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-1">Max: <span className="font-semibold">{performance.maxCombinedCce.toFixed(2)}</span></p>
                          <p className="text-[10px] text-gray-600">Pct: <span className="font-semibold">{performance.combinedPercentage.toFixed(1)}%</span></p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Combined</p>
                          <p className={`text-base font-black ${colors.text}`}>{performance.combinedCceMark.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {selectedSubject && studentPerformance.length === 0 && !isLoading && (
          <p className="text-center text-gray-500 py-8">
            No performance data found for this subject
          </p>
        )}

        {!selectedSubject && (
          <p className="text-center text-gray-500 py-8">
            Select a subject to view performance data
          </p>
        )}
      </main>
    </div>
  );
}
