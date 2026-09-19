import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, Trash2, CheckCircle2, PlayCircle, AlertTriangle } from "lucide-react";
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
import { useLocation } from "wouter";

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  collegeId: string;
  createdAt: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function SemesterManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: semesters = [], isLoading } = useQuery<Semester[]>({
    queryKey: ["semesters"],
    queryFn: async () => {
      const res = await axios.get("/api/semesters");
      return res.data;
    },
  });

  const activeSemester = semesters.find((s) => s.isActive) ?? null;

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

  /** "Start New Semester" — seals old marks and activates the chosen semester */
  const startSemester = useMutation({
    mutationFn: (id: string) => axios.post(`/api/semesters/${id}/start`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["semesters"] });
      toast({
        title: "New Semester Started 🎉",
        description: res.data.message,
      });
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createSemester.mutate(form);
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
              Create semesters and start new ones to clear current-semester DVT
              marks.
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
                <DialogDescription>
                  Give the semester a name and date range.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
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
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createSemester.isPending}
                  >
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
              <p className="font-semibold text-green-800">
                Active: {activeSemester.name}
              </p>
              <p className="text-xs text-green-700">
                {formatDate(activeSemester.startDate)} →{" "}
                {formatDate(activeSemester.endDate)}
              </p>
            </div>
          </div>
        )}

        {/* Semester list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg bg-gray-100 animate-pulse"
              />
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
                className={`p-4 flex items-center gap-4 ${
                  s.isActive ? "border-green-400 border-2" : ""
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {s.name}
                    </span>
                    {s.isActive && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(s.startDate)} → {formatDate(s.endDate)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* "Start New Semester" — only for inactive semesters when there IS an active one */}
                  {!s.isActive && activeSemester && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                          disabled={startSemester.isPending}
                        >
                          <PlayCircle className="h-4 w-4" />
                          Start New Semester
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Start New Semester?
                          </AlertDialogTitle>
                          <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm text-gray-700">
                              <p>
                                This will transition from{" "}
                                <strong>{activeSemester.name}</strong> to{" "}
                                <strong>{s.name}</strong>.
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-gray-600">
                                <li>
                                  All current DVT marks will be{" "}
                                  <strong>sealed</strong> under the outgoing
                                  semester and hidden from the active view.
                                </li>
                                <li>
                                  New evaluations will belong to{" "}
                                  <strong>{s.name}</strong>.
                                </li>
                                <li>
                                  Old marks are <strong>not deleted</strong> —
                                  they stay in the database.
                                </li>
                              </ul>
                              <p className="font-medium text-orange-700">
                                This action cannot be undone from the app.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => startSemester.mutate(s._id)}
                          >
                            Yes, Start New Semester
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                            Are you sure you want to delete{" "}
                            <strong>{s.name}</strong>? This cannot be undone.
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
    </div>
  );
}

