import { useState, useEffect } from "react";
import Header from "@/components/Header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  ArrowUpDown,
  MessageCircle,
  User,
  Hash,
  Target,
  Trophy,
  Percent,
  ChartBar,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { getMarkColors } from "@/lib/colors";
import { AskMeModal } from "@/components/AskMeModal";
import { useToast } from "@/hooks/use-toast";
import {
  useActiveGradingConfig,
  getDefaultGradingLevels,
} from "@/hooks/use-grading-config";
import {
  getMarkLabel,
  getMarkColors as getGradingMarkColors,
  getMarkEmoji,
  getMarkCardColors,
} from "@/lib/grading-utils";

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  adNumber: string;
}

interface DvtMark {
  _id: string;
  studentId: string;
  subject: string;
  class: number;
  mark: number;
  date: string;
  punishment?: string;
}

interface Evaluation {
  id: string;
  studentName: string;
  rollNumber: string;
  adNumber: string;
  mark: number;
  date: string;
  punishment?: string;
}

interface SubjectHistory {
  subject: string;
  evaluations: Evaluation[];
}

interface EditDialogProps {
  evaluation: Evaluation;
  onSave: (id: string, mark: number, punishment?: string) => Promise<void>;
}

interface DeleteDialogProps {
  evaluation: {
    id: string;
    studentName: string;
    date: string;
  };
  onConfirm: (id: string) => Promise<void>;
}

const EditDialog = ({ evaluation, onSave }: EditDialogProps) => {
  const { toast } = useToast();
  const [mark, setMark] = useState(evaluation.mark);
  const [punishment, setPunishment] = useState(evaluation.punishment || "");

  // Get active grading configuration
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || getDefaultGradingLevels();

  const handleSave = async () => {
    await onSave(evaluation.id, mark, punishment);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Evaluation</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-medium mb-1">Mark</label>
          <Select
            value={mark.toString()}
            onValueChange={(value) => setMark(parseInt(value))}
          >
            <SelectTrigger className="bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gradingLevels.map((level) => (
                <SelectItem key={level.mark} value={level.mark.toString()}>
                  {level.emoji} {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* <div>
          <label className="block text-sm font-medium mb-1">
            Punishment (optional)
          </label>
          <input
            type="text"
            value={punishment}
            onChange={(e) => setPunishment(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div> */}
        <DialogClose asChild>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
};

const DeleteDialog = ({ evaluation, onConfirm }: DeleteDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm(evaluation.id);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-red-600"
          onSelect={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
        >
          Delete
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this evaluation?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the evaluation for{" "}
            {evaluation.studentName} from{" "}
            {format(new Date(evaluation.date), "PPp")}. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function History() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [history, setHistory] = useState<SubjectHistory | null>(null);
  const [dvtMarks, setDvtMarks] = useState<DvtMark[]>([]);
  const [students, setStudents] = useState<{ [key: string]: Student }>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAskMeModalOpen, setIsAskMeModalOpen] = useState(false);

  // Get active grading configuration
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || getDefaultGradingLevels();
  // Fetch all students when component mounts
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/students`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      console.log(data);
      // Convert array to object with _id as key
      const studentsMap = data.reduce(
        (acc: { [key: string]: Student }, student: Student) => {
          acc[student._id] = student;
          console.log(student._id);
          return acc;
        },
        {}
      );
      setStudents(studentsMap);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch all DvtMarks when component mounts
  const fetchDvtMarks = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/dvtMarks`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch DvtMarks");
      const data = await response.json();
      console.log("Fetched DvtMarks:", data);
      setDvtMarks(data);
    } catch (error) {
      console.error("Error fetching DvtMarks:", error);
    }
  };
  useEffect(() => {
    fetchDvtMarks();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
      const response = await fetch(`${baseUrl}/api/dvtMarks/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete evaluation");
      }

      // Update local state
      setDvtMarks((prevMarks) => prevMarks.filter((mark) => mark._id !== id));
      toast({
        title: "Evaluation deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete evaluation",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string, mark: number, punishment?: string) => {
    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
      const response = await fetch(`${baseUrl}/api/dvtMarks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include token in headers
        },
        credentials: "include",
        body: JSON.stringify({ mark, punishment }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update evaluation");
      }

      const updatedMark = await response.json();

      // Update local state
      setDvtMarks((prevMarks) =>
        prevMarks.map((m) => (m._id === id ? { ...m, mark, punishment } : m))
      );

      toast({
        title: "Evaluation updated successfully",
      });
    } catch (error) {
      console.error("Error updating evaluation:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update evaluation",
        variant: "destructive",
      });
    }
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // When subject changes or sort order changes, filter and organize the history
  useEffect(() => {
    if (!selectedSubject || !dvtMarks.length || !Object.keys(students).length)
      return;

    const [subject, classStr] = selectedSubject.split("|");
    const classNum = parseInt(classStr);

    const subjectHistory: SubjectHistory = {
      subject: subject,
      evaluations: [],
    };
    console.log(students);
    console.log(subject);

    const filteredMarks = dvtMarks.filter(
      (mark) => mark.subject === subject && mark.class === classNum
    );
    console.log(filteredMarks);

    subjectHistory.evaluations = filteredMarks
      .map((mark) => {
        const student = students[mark.studentId];
        console.log(mark);
        if (!student) {
          console.warn(`Student not found for ID: ${mark.studentId}`);
          return null;
        }
        const evaluation: Evaluation = {
          id: mark._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          adNumber: student.adNumber,
          mark: mark.mark,
          date: mark.date,
          punishment: mark.punishment,
        };
        return evaluation;
      })
      .filter((evaluation): evaluation is Evaluation => evaluation !== null);

    // Sort by date
    subjectHistory.evaluations.sort((a, b) => {
      const comparison =
        new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });

    setHistory(subjectHistory);
  }, [selectedSubject, dvtMarks, students, sortOrder]);

  // Use the grading configuration for mark labels
  const getMarkLabelForHistory = (mark: number) => {
    return getMarkLabel(mark, gradingLevels);
  };

  const handleAskMeClick = (adNumber: string) => {
    console.log(students);
    const student = Object.values(students).find(
      (student) => student.adNumber === adNumber
    );
    console.log(student);
    setSelectedStudent(student || null);
    setIsAskMeModalOpen(true);
  };

  const handleEvaluate = async (mark: number) => {
    if (!selectedStudent || !user) return;

    const subject = selectedSubject.split("|")[0];
    const classNum = parseInt(selectedSubject.split("|")[1]);

    try {
      const response = await fetch(`${baseUrl}/api/dvtmarks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          studentId: selectedStudent._id,
          subject: subject,
          adNumber: selectedStudent.adNumber,
          mark,
          class: classNum,
          tId: user?.tId,
        }),
      });
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to save evaluation");
      }

      toast({
        title: "Evaluation Saved",
        description: `Successfully evaluated ${selectedStudent.name} ${response.status}`,
      });

      // Refresh the data
      fetchStudents();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Error",
        description: "Failed to save evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchStudents(), fetchDvtMarks()]);
      toast({
        title: "Data Refreshed",
        description: "Successfully refreshed student data and evaluations.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => {setLocation('/')}} />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">
            Evaluation History
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
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

        {/* History Display */}
        {history && (
          <div className="space-y-4">
            {history.evaluations.map((evaluation) => {
              const colors = getMarkCardColors(evaluation.mark, gradingLevels);
              return (
                <Card
                  key={evaluation.id}
                  style={{ 
                    background: `linear-gradient(to bottom right, ${colors}42, ${colors}42)`,
                  }}
                  className={`w-full max-w-md mx-auto border-0 shadow-xl overflow-hidden`}
                >
                  {/* Header Section */}
                  <div
                    className={`px-4 py-4`}
                    style={{
                      background: `linear-gradient(to right, ${colors}, ${colors}c7)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="text-base font-bold text-white leading-tight">
                            {evaluation.studentName}
                          </h2>
                          <p className="text-white/80 text-xs font-normal">
                            {format(new Date(evaluation.date), "PPp")}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 bg-white/20 px-3 py-1 rounded flex items-center gap-2 cursor-pointer hover:bg-white/30 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                Edit
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <EditDialog
                              evaluation={evaluation}
                              onSave={handleEdit}
                            />
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                // onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  handleAskMeClick(evaluation.adNumber)
                                }
                              >
                                Ask Me
                              </DropdownMenuItem>
                            </DialogTrigger>
                          </Dialog>
                          <DeleteDialog
                            evaluation={{
                              id: evaluation.id,
                              studentName: evaluation.studentName,
                              date: evaluation.date,
                            }}
                            onConfirm={handleDelete}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 space-y-4">
                    {/* Performance Metrics */}
                    <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <User
                              className={`w-4 h-4`}
                              style={{ color: `${colors}` }}
                            />
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Roll No
                            </p>
                          </div>
                          <p className="text-lg font-bold text-gray-800">
                            {evaluation.rollNumber}
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Hash
                              className={`w-4 h-4`}
                              style={{ color: `${colors}` }}
                            />
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Ad. No
                            </p>
                          </div>
                          <p className="text-lg font-bold text-gray-800">
                            {evaluation.adNumber}
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <ChartBar
                              className={`w-4 h-4`}
                              style={{ color: `${colors}` }}
                            />
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              Status
                            </p>
                          </div>
                          <p
                            className={`text-lg font-bold`}
                            style={{ color: `${colors}` }}
                          >
                            {/* {getMarkEmoji(evaluation.mark, gradingLevels)}{" "} */}
                            {getMarkLabelForHistory(evaluation.mark)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* {evaluation.punishment && (
                      <div className="bg-white/80 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <MessageCircle className={`w-4 h-4 ${colors.icon}`} />
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Punishment
                          </p>
                        </div> 
                        <p className={`text-sm font-medium ${colors.text}`}>
                          {evaluation.punishment}
                        </p>
                      </div>
                    )} */}
                  </div>
                </Card>
              );
            })}

            {history.evaluations.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No evaluations found for this subject
              </p>
            )}
          </div>
        )}

        {!selectedSubject && (
          <p className="text-center text-gray-500 py-8">
            Select a subject to view evaluation history
          </p>
        )}
      </main>

      {selectedStudent && (
        <AskMeModal
          isOpen={isAskMeModalOpen}
          onClose={() => setIsAskMeModalOpen(false)}
          student={selectedStudent}
          onEvaluate={handleEvaluate}
          subject={selectedSubject.split("|")[0]}
          class={parseInt(selectedSubject.split("|")[1])}
        />
      )}
    </div>
  );
}
