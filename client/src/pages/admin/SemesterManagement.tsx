import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  Users,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

// ── Types ────────────────────────────────────────────────────────────────────

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  collegeId: string;
  createdAt: string;
}

interface Student {
  _id: string;
  name: string;
  fullName?: string;
  rollNumber: number;
  adNumber: number;
  class: number;
  active: boolean;
  status: "active" | "completed";
  batchNumber?: number;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Wizard steps
type WizardStep = "students" | "teachers" | "confirm";

// ── Component ─────────────────────────────────────────────────────────────────

export default function SemesterManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  // Transition wizard
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTargetSemester, setWizardTargetSemester] = useState<Semester | null>(null);
  const [wizardStep, setWizardStep] = useState<WizardStep>("students");

  // Students step state
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  // Track local overrides: active toggle per student (before submitting)
  const [studentActiveOverrides, setStudentActiveOverrides] = useState<Record<string, boolean>>({});

  // Teachers step state
  const [teacherActiveOverrides, setTeacherActiveOverrides] = useState<Record<string, boolean>>({});

  // Pending operations (accumulated during wizard, executed on confirm)
  const [pendingPromoteIds, setPendingPromoteIds] = useState<string[]>([]);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: semesters = [], isLoading } = useQuery<Semester[]>({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await axios.get("/api/semesters");
      return res.data;
    },
  });

  const { data: allStudents = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await axios.get("/api/students");
      return res.data;
    },
    enabled: wizardOpen && wizardStep === "students",
  });

  const { data: allTeachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await axios.get("/api/teachers");
      return res.data;
    },
    enabled: wizardOpen && wizardStep === "teachers",
  });

  const activeSemester = semesters.find((s) => s.isActive) ?? null;

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeStudents = useMemo(
    () => allStudents.filter((s) => s.status !== "completed"),
    [allStudents]
  );

  const availableClasses = useMemo(() => {
    const classes = [...new Set(activeStudents.map((s) => s.class))].sort((a, b) => a - b);
    return classes;
  }, [activeStudents]);

  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return activeStudents;
    return activeStudents.filter((s) => String(s.class) === classFilter);
  }, [activeStudents, classFilter]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createSemester = useMutation({
    mutationFn: (data: { name: string; startDate: string; endDate: string }) =>
      axios.post("/api/semesters", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      toast({ title: "Semester created" });
      setShowCreateDialog(false);
      setForm({ name: "", startDate: "", endDate: "" });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e.response?.data?.error ?? "Failed to create semester",
        variant: "destructive",
      });
    },
  });

  const activateSemester = useMutation({
    mutationFn: (id: string) => axios.put(`/api/semesters/${id}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      toast({ title: "Semester activated" });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e.response?.data?.error ?? "Failed to activate semester",
        variant: "destructive",
      });
    },
  });

  const startSemester = useMutation({
    mutationFn: (id: string) => axios.post(`/api/semesters/${id}/start`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      toast({ title: "New Semester Started 🎉", description: res.data.message });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e.response?.data?.error ?? "Failed to start semester",
        variant: "destructive",
      });
    },
  });

  const deleteSemester = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/semesters/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      toast({ title: "Semester deleted" });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e.response?.data?.error ?? "Failed to delete semester",
        variant: "destructive",
      });
    },
  });

  // ── Wizard helpers ─────────────────────────────────────────────────────────

  const openWizard = (semester: Semester) => {
    setWizardTargetSemester(semester);
    setWizardStep("students");
    setSelectedStudentIds([]);
    setStudentActiveOverrides({});
    setTeacherActiveOverrides({});
    setPendingPromoteIds([]);
    setClassFilter("all");
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardTargetSemester(null);
  };

  // Students step: select all in current filter
  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds((prev) => {
        const ids = new Set(prev);
        filteredStudents.forEach((s) => ids.add(s._id));
        return [...ids];
      });
    } else {
      const filteredIds = new Set(filteredStudents.map((s) => s._id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    }
  };

  const handleToggleStudent = (id: string, checked: boolean) => {
    setSelectedStudentIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleStudentActiveToggle = (studentId: string, active: boolean) => {
    setStudentActiveOverrides((prev) => ({ ...prev, [studentId]: active }));
  };

  const handleTeacherActiveToggle = (teacherId: string, active: boolean) => {
    setTeacherActiveOverrides((prev) => ({ ...prev, [teacherId]: active }));
  };

  // Move from students step to teachers step — stage the promote IDs
  const handleStudentsNext = () => {
    setPendingPromoteIds(selectedStudentIds);
    setWizardStep("teachers");
  };

  const handleTeachersNext = () => {
    setWizardStep("confirm");
  };

  // Final confirm: execute all staged changes then start semester
  const [isExecuting, setIsExecuting] = useState(false);

  const handleConfirmAndStart = async () => {
    if (!wizardTargetSemester) return;
    setIsExecuting(true);
    try {
      // 1. Promote selected students
      if (pendingPromoteIds.length > 0) {
        await axios.post("/api/students/bulk-promote", { studentIds: pendingPromoteIds });
      }

      // 2. Apply student active overrides
      const studentOverrideEntries = Object.entries(studentActiveOverrides);
      for (const [id, active] of studentOverrideEntries) {
        await axios.patch(`/api/students/${id}/toggle-active`, { active });
      }

      // 3. Apply teacher active overrides
      const teacherOverrideEntries = Object.entries(teacherActiveOverrides);
      for (const [id, active] of teacherOverrideEntries) {
        // Use the existing PUT /:teacherId route with just the active field
        const teacher = allTeachers.find((t) => t._id === id);
        if (teacher) {
          await axios.put(`/api/teachers/${id}`, { ...teacher, active });
        }
      }

      // 4. Start the semester (seals marks, activates new semester)
      await startSemester.mutateAsync(wizardTargetSemester._id);

      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["teachers"] });
      closeWizard();
    } catch (err: any) {
      toast({
        title: "Error during transition",
        description: err.response?.data?.error ?? err.response?.data?.message ?? "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.includes(s._id));

  const someFilteredSelected =
    filteredStudents.some((s) => selectedStudentIds.includes(s._id)) && !allFilteredSelected;

  return (
    <div className="mx-auto max-w-4xl bg-white min-h-screen shadow-lg">
      <Header showContext={false} onHomeClick={() => setLocation("/")} />

      <main className="p-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              Semester Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create semesters and start new ones to clear current-semester DVT marks.
            </p>
          </div>

          {/* Create button */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Semester
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Semester</DialogTitle>
                <DialogDescription>Give the semester a name and date range.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => { e.preventDefault(); createSemester.mutate(form); }}
                className="space-y-4 mt-2"
              >
                <div>
                  <Label htmlFor="name">Semester Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Semester 1 — 2026"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createSemester.isPending}>
                    {createSemester.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active semester banner */}
        {activeSemester && (
          <div className="mb-6 p-4 rounded-lg border-2 border-green-400 bg-green-50 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-green-800">Active: {activeSemester.name}</p>
              <p className="text-xs text-green-700">
                {formatDate(activeSemester.startDate)} → {formatDate(activeSemester.endDate)}
              </p>
            </div>
          </div>
        )}

        {/* Semester list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CalendarDays className="mx-auto h-12 w-12 mb-3" />
            <p className="font-medium">No semesters yet</p>
            <p className="text-sm">Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {semesters.map((s) => (
              <Card
                key={s._id}
                className={`p-4 flex items-center gap-4 ${s.isActive ? "border-green-400 border-2" : ""}`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{s.name}</span>
                    {s.isActive && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(s.startDate)} → {formatDate(s.endDate)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* "Start New Semester" — opens the wizard */}
                  {!s.isActive && activeSemester && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                      onClick={() => openWizard(s)}
                    >
                      <PlayCircle className="h-4 w-4" />
                      Start New Semester
                    </Button>
                  )}

                  {/* Simple activate — when no semester is active */}
                  {!s.isActive && !activeSemester && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => activateSemester.mutate(s._id)}
                      disabled={activateSemester.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Activate
                    </Button>
                  )}

                  {/* Delete — only inactive semesters */}
                  {!s.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Semester?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{s.name}</strong>? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteSemester.mutate(s._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* ── Transition Wizard Dialog ─────────────────────────────────────────── */}
      <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) closeWizard(); }}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] flex flex-col">
          {/* Wizard header */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <PlayCircle className="h-5 w-5" />
              Start New Semester: {wizardTargetSemester?.name}
            </DialogTitle>
            <DialogDescription>
              {wizardStep === "students" && "Promote or manage student status before switching semesters."}
              {wizardStep === "teachers" && "Activate or deactivate teachers for the new semester."}
              {wizardStep === "confirm" && "Review and confirm all changes. This will seal current DVT marks."}
            </DialogDescription>

            {/* Step indicator */}
            <div className="flex items-center gap-2 pt-2">
              {(["students", "teachers", "confirm"] as WizardStep[]).map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                      ${wizardStep === step
                        ? "bg-blue-600 text-white"
                        : idx < ["students", "teachers", "confirm"].indexOf(wizardStep)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-xs capitalize ${wizardStep === step ? "font-semibold text-blue-700" : "text-gray-400"}`}>
                    {step}
                  </span>
                  {idx < 2 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                </div>
              ))}
            </div>
          </DialogHeader>

          {/* ── Step: Students ──────────────────────────────────────────────── */}
          {wizardStep === "students" && (
            <div className="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">
              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {availableClasses.map((c) => (
                      <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm text-gray-500">
                  {selectedStudentIds.length} selected
                </span>
              </div>

              {/* Student table */}
              <div className="overflow-y-auto flex-1 border rounded-md">
                {studentsLoading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Loading students…</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No active students found.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 border-b">
                      <tr>
                        <th className="p-2 w-8">
                          <Checkbox
                            checked={allFilteredSelected}
                            ref={(el) => {
                              if (el && "indeterminate" in el) {
                                (el as any).indeterminate = someFilteredSelected;
                              }
                            }}
                            onCheckedChange={(c) => handleSelectAllStudents(!!c)}
                          />
                        </th>
                        <th className="p-2 text-left font-medium text-gray-600">Name</th>
                        <th className="p-2 text-center font-medium text-gray-600">Class</th>
                        <th className="p-2 text-center font-medium text-gray-600">Roll No.</th>
                        <th className="p-2 text-center font-medium text-gray-600">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => {
                        const isSelected = selectedStudentIds.includes(student._id);
                        const activeOverride = studentActiveOverrides[student._id];
                        const effectiveActive = activeOverride !== undefined ? activeOverride : student.active;
                        const willGraduate = isSelected && student.class >= 10;

                        return (
                          <tr
                            key={student._id}
                            className={`border-b last:border-0 ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                          >
                            <td className="p-2 text-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(c) => handleToggleStudent(student._id, !!c)}
                              />
                            </td>
                            <td className="p-2">
                              <div className="font-medium text-gray-900">{student.name}</div>
                              {willGraduate && (
                                <span className="text-xs text-orange-600 font-medium">→ Will graduate (Class 10)</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline">
                                {isSelected && !willGraduate ? (
                                  <span className="text-green-700 font-semibold">{student.class} → {student.class + 1}</span>
                                ) : willGraduate ? (
                                  <span className="text-orange-600 font-semibold">10 → ✓</span>
                                ) : (
                                  student.class
                                )}
                              </Badge>
                            </td>
                            <td className="p-2 text-center text-gray-600">{student.rollNumber}</td>
                            <td className="p-2 text-center">
                              <Switch
                                checked={effectiveActive}
                                onCheckedChange={(v) => handleStudentActiveToggle(student._id, v)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Legend */}
              <p className="text-xs text-gray-400 shrink-0">
                ✓ Select students to promote (class +1). Students in Class 10 will be marked <em>completed</em> with a batch number.
              </p>
            </div>
          )}

          {/* ── Step: Teachers ──────────────────────────────────────────────── */}
          {wizardStep === "teachers" && (
            <div className="flex-1 overflow-hidden flex flex-col gap-3 min-h-0">
              <div className="overflow-y-auto flex-1 border rounded-md">
                {teachersLoading ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Loading teachers…</div>
                ) : allTeachers.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No teachers found.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 border-b">
                      <tr>
                        <th className="p-2 text-left font-medium text-gray-600">Name</th>
                        <th className="p-2 text-left font-medium text-gray-600">Email</th>
                        <th className="p-2 text-center font-medium text-gray-600">Role</th>
                        <th className="p-2 text-center font-medium text-gray-600">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTeachers.map((teacher) => {
                        const activeOverride = teacherActiveOverrides[teacher._id];
                        const effectiveActive = activeOverride !== undefined ? activeOverride : teacher.active;
                        return (
                          <tr key={teacher._id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="p-2 font-medium text-gray-900">{teacher.name}</td>
                            <td className="p-2 text-gray-500 text-xs">{teacher.email}</td>
                            <td className="p-2 text-center">
                              <Badge variant={teacher.role === "super_admin" ? "destructive" : "default"}>
                                {teacher.role === "super_admin" ? "Super Admin" : "Teacher"}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              <Switch
                                checked={effectiveActive}
                                onCheckedChange={(v) => handleTeacherActiveToggle(teacher._id, v)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <p className="text-xs text-gray-400 shrink-0">
                Toggle teachers active/inactive for the new semester. Changes apply when you confirm.
              </p>
            </div>
          )}

          {/* ── Step: Confirm ──────────────────────────────────────────────── */}
          {wizardStep === "confirm" && (
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-orange-800 space-y-1">
                    <p className="font-semibold">This will transition from <em>{activeSemester?.name}</em> to <em>{wizardTargetSemester?.name}</em>.</p>
                    <ul className="list-disc list-inside text-orange-700 space-y-0.5">
                      <li>All current DVT marks will be <strong>sealed</strong> under the outgoing semester.</li>
                      <li>New evaluations will belong to <strong>{wizardTargetSemester?.name}</strong>.</li>
                      <li>Old marks are <strong>not deleted</strong> — they stay in the database.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-sm text-blue-800">
                    <strong>{pendingPromoteIds.length}</strong> student(s) will be promoted
                    {pendingPromoteIds.length > 0 && (
                      <>
                        {" "}(incl.{" "}
                        <strong>
                          {allStudents.filter((s) => pendingPromoteIds.includes(s._id) && s.class >= 10).length}
                        </strong>{" "}
                        graduating from Class 10)
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <Users className="h-4 w-4 text-purple-600 shrink-0" />
                  <span className="text-sm text-purple-800">
                    <strong>{Object.keys(studentActiveOverrides).length}</strong> student active status change(s)
                  </span>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <UserCheck className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-800">
                    <strong>{Object.keys(teacherActiveOverrides).length}</strong> teacher active status change(s)
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                This action cannot be undone from the app. Click <strong>Confirm & Start</strong> to proceed.
              </p>
            </div>
          )}

          {/* ── Footer nav ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-3 border-t shrink-0">
            {/* Back / Cancel */}
            <div className="flex gap-2">
              {wizardStep !== "students" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setWizardStep(wizardStep === "confirm" ? "teachers" : "students")
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={closeWizard}>
                Cancel
              </Button>
            </div>

            {/* Skip / Next / Confirm */}
            <div className="flex gap-2">
              {wizardStep === "students" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPendingPromoteIds([]);
                      setStudentActiveOverrides({});
                      setWizardStep("teachers");
                    }}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                  <Button size="sm" onClick={handleStudentsNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}

              {wizardStep === "teachers" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTeacherActiveOverrides({});
                      setWizardStep("confirm");
                    }}
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                  <Button size="sm" onClick={handleTeachersNext}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </>
              )}

              {wizardStep === "confirm" && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleConfirmAndStart}
                  disabled={isExecuting}
                >
                  {isExecuting ? "Starting…" : "Confirm & Start"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
