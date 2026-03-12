import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-utils";
import { Assignment } from "@/types";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";

interface AssignmentMarkRow {
  studentId: string;
  studentName: string;
  rollNumber: string | number;
  adNumber: string | number;
  mark: number | "";
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMarksDialogOpen, setIsMarksDialogOpen] = useState(false);

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [marksAssignment, setMarksAssignment] = useState<Assignment | null>(null);

  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [maxMarks, setMaxMarks] = useState<string>("100");

  const [markRows, setMarkRows] = useState<AssignmentMarkRow[]>([]);
  const [isSavingMarks, setIsSavingMarks] = useState(false);

  const selectedSubjectInfo = useMemo(() => {
    if (!selectedSubject) return null;
    const [subject, classText] = selectedSubject.split("|");
    return { subject, classNumber: parseInt(classText, 10) };
  }, [selectedSubject]);

  const fetchAssignments = async () => {
    if (!selectedSubjectInfo) {
      setAssignments([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        subject: selectedSubjectInfo.subject,
        class: String(selectedSubjectInfo.classNumber),
      });
      const response = await apiFetch(`/api/assignments?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }
      const data = await response.json();
      setAssignments(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assignments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedSubject]);

  const resetForm = () => {
    setName("");
    setDetail("");
    setMaxMarks("100");
  };

  const handleCreateAssignment = async () => {
    if (!selectedSubjectInfo) {
      toast({
        title: "Select Lesson",
        description: "Please select a lesson before adding an assignment.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Assignment name required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiFetch("/api/assignments", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          detail: detail.trim(),
          subject: selectedSubjectInfo.subject,
          class: selectedSubjectInfo.classNumber,
          maxMarks: Number(maxMarks) || 100,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create assignment");
      }

      toast({ title: "Assignment added" });
      setIsAddDialogOpen(false);
      resetForm();
      await fetchAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create assignment.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setName(assignment.name || "");
    setDetail(assignment.detail || "");
    setMaxMarks(String(assignment.maxMarks || 100));
    setIsEditDialogOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;

    try {
      const response = await apiFetch(`/api/assignments/${editingAssignment._id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          detail: detail.trim(),
          maxMarks: Number(maxMarks) || editingAssignment.maxMarks || 100,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assignment");
      }

      toast({ title: "Assignment updated" });
      setIsEditDialogOpen(false);
      setEditingAssignment(null);
      resetForm();
      await fetchAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const response = await apiFetch(`/api/assignments/${assignmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      toast({ title: "Assignment deleted" });
      await fetchAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assignment.",
        variant: "destructive",
      });
    }
  };

  const openMarksDialog = async (assignment: Assignment) => {
    try {
      const response = await apiFetch(`/api/assignments/${assignment._id}/marks`);
      if (!response.ok) {
        throw new Error("Failed to fetch mark rows");
      }

      const data = await response.json();
      setMarksAssignment({ ...assignment, maxMarks: data.assignment?.maxMarks || assignment.maxMarks });
      const normalizedRows = (data.rows || []).map((row: any) => ({
        studentId: String(row.studentId),
        studentName: row.studentName,
        rollNumber: row.rollNumber,
        adNumber: row.adNumber,
        mark: row.mark === null || row.mark === undefined ? "" : Number(row.mark),
      }));
      setMarkRows(
        normalizedRows.sort(
          (a: AssignmentMarkRow, b: AssignmentMarkRow) => Number(a.rollNumber) - Number(b.rollNumber)
        )
      );
      setIsMarksDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open assignment marks.",
        variant: "destructive",
      });
    }
  };

  const updateRowMark = (studentId: string, value: string) => {
    setMarkRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        if (value === "") return { ...row, mark: "" };
        const max = marksAssignment?.maxMarks || 100;
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return row;
        const safeValue = Math.max(0, Math.min(parsed, max));
        return { ...row, mark: safeValue };
      })
    );
  };

  const handleSaveMarks = async () => {
    if (!marksAssignment) return;

    setIsSavingMarks(true);
    try {
      const entries = markRows.map((row) => ({
        studentId: row.studentId,
        mark: row.mark === "" ? null : row.mark,
      }));

      const response = await apiFetch(`/api/assignments/${marksAssignment._id}/marks`, {
        method: "PUT",
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        throw new Error("Failed to save marks");
      }

      toast({ title: "Assignment marks saved" });
      setIsMarksDialogOpen(false);
      setMarksAssignment(null);
      await fetchAssignments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save assignment marks.",
        variant: "destructive",
      });
    } finally {
      setIsSavingMarks(false);
    }
  };

  return (
    <div className="mx-auto max-w-md bg-white min-h-screen shadow-lg relative h-full flex flex-col">
      <Header showContext={true} onHomeClick={() => setLocation("/")} />

      <main className="flex-1 p-6">
        <div className="flex justify-start items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-600">Assignments</h1>
        </div>

        <div className="space-y-3 mb-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full bg-blue-50 text-blue-600 font-medium border-blue-600 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-600 focus:bg-blue-100 focus:text-blue-600 focus:border-blue-600 focus:outline-none">
              <SelectValue placeholder="Select a lesson" />
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!selectedSubject}
                onClick={() => {
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Assignment name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                  placeholder="Small detail about this assignment"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="Maximum marks"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                />
                <Button className="w-full" onClick={handleCreateAssignment}>
                  Save Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {!selectedSubject && (
            <p className="text-center text-gray-500 py-8">
              Select a lesson to view assignments
            </p>
          )}

          {selectedSubject && isLoading && (
            <p className="text-center text-gray-500 py-8">Loading assignments...</p>
          )}

          {selectedSubject && !isLoading && assignments.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No assignments added for this lesson yet
            </p>
          )}

          {assignments.map((assignment) => (
            <Card key={assignment._id} className="p-4 shadow-md border border-blue-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-blue-700">{assignment.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{assignment.detail || "No detail added"}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Max Marks: {assignment.maxMarks} | Entered: {assignment.marks?.length || 0}
                  </p>
                </div>
                <ClipboardCheck className="w-5 h-5 text-blue-500" />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button
                  variant="outline"
                  className="text-blue-600 border-blue-300"
                  onClick={() => openMarksDialog(assignment)}
                >
                  Marks
                </Button>
                <Button
                  variant="outline"
                  className="text-amber-600 border-amber-300"
                  onClick={() => openEditDialog(assignment)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 border-red-300">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete assignment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the assignment and all entered marks.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeleteAssignment(assignment._id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Assignment name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Small detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            />
            <Input
              type="number"
              min={1}
              placeholder="Maximum marks"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
            />
            <Button className="w-full" onClick={handleUpdateAssignment}>
              Update Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMarksDialogOpen} onOpenChange={setIsMarksDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {marksAssignment?.name || "Assignment"} Marks ({marksAssignment?.maxMarks || 0})
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-2">
              {markRows.map((row) => (
                <div
                  key={row.studentId}
                  className="flex items-center justify-between gap-2 border rounded-md p-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.studentName}</p>
                    <p className="text-xs text-gray-500">
                      Sl #{row.rollNumber} | Ad {row.adNumber}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={marksAssignment?.maxMarks || 100}
                    value={row.mark}
                    onChange={(e) => updateRowMark(row.studentId, e.target.value)}
                    className="w-24"
                    placeholder="Mark"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          <Button loading={isSavingMarks} onClick={handleSaveMarks}>
            Save Marks
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
