import { useState, useEffect } from "react";
import { Student, GradingLevel } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useActiveGradingConfig,
  getDefaultGradingLevels,
} from "@/hooks/use-grading-config";
import {
  saveBulkBatchEvaluations,
  saveIndividualEvaluation,
  type BulkBatchEvaluationData,
  type IndividualEvaluationData,
} from "@/lib/bulk-evaluation-api";
import { Package, Zap, Users, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BulkEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedSubject?: { subject: string; class: number };
  teacherId?: string;
  onBulkEvaluate?: (
    studentEvaluations: Array<{
      studentId: string;
      evaluation: string;
      mark: number;
    }>
  ) => void;
  onIndividualEvaluate?: (
    studentId: string,
    evaluation: string,
    mark: number
  ) => Promise<boolean>;
  onEvaluationComplete?: () => void;
}

type EvaluationMode = "batch" | "individual";

export function BulkEvaluationModal({
  isOpen,
  onClose,
  students: initialStudents,
  selectedSubject,
  teacherId,
  onBulkEvaluate,
  onIndividualEvaluate,
  onEvaluationComplete,
}: BulkEvaluationModalProps) {
  // Get active grading configuration
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || getDefaultGradingLevels();
  const { toast } = useToast();

  // Evaluation mode state
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>("batch");

  // State to track remaining students (for individual mode)
  const [remainingStudents, setRemainingStudents] =
    useState<Student[]>(initialStudents);

  // State to track each student's selected evaluation (for batch mode)
  const [studentEvaluations, setStudentEvaluations] = useState<
    Record<string, { evaluation: string; mark: number } | null>
  >({});

  // Loading states
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Helper function to get default emoji for grading levels without emoji
  const getDefaultEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("great") || lowerName.includes("excellent"))
      return "😊";
    if (lowerName.includes("good") || lowerName.includes("average"))
      return "🙂";
    if (lowerName.includes("poor") || lowerName.includes("bad")) return "☹️";
    return "😐";
  };

  // Reset students list when modal opens
  useEffect(() => {
    if (isOpen) {
      setRemainingStudents(initialStudents);
      setStudentEvaluations({});
    }
  }, [isOpen, initialStudents]);

  // Handle individual student evaluation
  const handleStudentEvaluation = async (
    studentId: string,
    level: GradingLevel
  ) => {
    if (evaluationMode === "batch") {
      // Batch mode: toggle selection (select if not selected, deselect if already selected)
      setStudentEvaluations((prev) => {
        const currentSelection = prev[studentId];
        const isCurrentlySelected =
          currentSelection?.evaluation === level.name.toLowerCase();

        if (isCurrentlySelected) {
          // Deselect if already selected
          return {
            ...prev,
            [studentId]: null,
          };
        } else {
          // Select the new evaluation
          return {
            ...prev,
            [studentId]: {
              evaluation: level.name.toLowerCase(),
              mark: level.mark,
            },
          };
        }
      });
    } else {
      // Individual mode: save immediately and remove from list
      console.log("Individual evaluation debug:", {
        selectedSubject,
        teacherId,
        hasSelectedSubject: !!selectedSubject,
        hasTeacherId: !!teacherId,
      });

      if (!selectedSubject || !teacherId) {
        console.error("Missing required data:", { selectedSubject, teacherId });
        toast({
          title: "Error",
          description: `Subject and teacher information required. Missing: ${
            !selectedSubject ? "subject" : ""
          } ${!teacherId ? "teacher" : ""}`,
          variant: "destructive",
        });
        return;
      }

      setSavingStudentId(studentId);

      try {
        const evaluationData: IndividualEvaluationData = {
          studentId,
          evaluation: level.name.toLowerCase(),
          mark: level.mark,
          subject: selectedSubject.subject,
          class: selectedSubject.class,
          tId: teacherId,
        };

        const result = await saveIndividualEvaluation(evaluationData);

        if (result.success) {
          // Remove student from remaining list
          setRemainingStudents((prev) =>
            prev.filter((student) => student._id !== studentId)
          );

          toast({
            title: "✅ Evaluation Saved",
            description: `${result.data.studentName} evaluated as ${level.name}`,
            duration: 2000,
          });

          // Check if all students are evaluated
          const newRemainingCount = remainingStudents.length - 1;
          if (newRemainingCount === 0) {
            toast({
              title: "🎉 All Complete!",
              description: `All ${initialStudents.length} students have been evaluated`,
              duration: 4000,
            });
            onEvaluationComplete?.();
          }
        } else {
          toast({
            title: "❌ Save Failed",
            description:
              result.message || "Could not save evaluation. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Individual evaluation error:", error);
        toast({
          title: "❌ Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to save evaluation. Please try again.",
          variant: "destructive",
        });
      } finally {
        setSavingStudentId(null);
      }
    }
  };

  // Handle "Grade for All" buttons (only for batch mode)
  const handleGradeForAll = (selectedLevel: GradingLevel) => {
    if (evaluationMode !== "batch") return;

    const allEvaluations: Record<string, { evaluation: string; mark: number }> =
      {};
    remainingStudents.forEach((student) => {
      allEvaluations[student._id] = {
        evaluation: selectedLevel.name.toLowerCase(),
        mark: selectedLevel.mark,
      };
    });
    setStudentEvaluations(allEvaluations);

    toast({
      title: "✅ Applied to All",
      description: `Set ${selectedLevel.name} for all ${remainingStudents.length} students`,
      duration: 2000,
    });
  };

  // Handle mode toggle
  const handleModeToggle = (checked: boolean) => {
    const newMode: EvaluationMode = checked ? "individual" : "batch";
    setEvaluationMode(newMode);

    // Clear evaluations when switching modes
    setStudentEvaluations({});

    toast({
      title: `Switched to ${newMode === "batch" ? "Batch" : "Individual"} Mode`,
      description:
        newMode === "batch"
          ? "Evaluate all students then save together"
          : "Each evaluation saves immediately and removes student from list",
      duration: 3000,
    });
  };

  // Handle save button click - show confirmation dialog
  const handleSave = async () => {
    console.log("Batch save debug:", {
      selectedSubject,
      teacherId,
      hasSelectedSubject: !!selectedSubject,
      hasTeacherId: !!teacherId,
    });

    if (!selectedSubject || !teacherId) {
      console.error("Missing required data for batch save:", {
        selectedSubject,
        teacherId,
      });
      toast({
        title: "Error",
        description: `Subject and teacher information required. Missing: ${
          !selectedSubject ? "subject" : ""
        } ${!teacherId ? "teacher" : ""}`,
        variant: "destructive",
      });
      return;
    }

    const evaluationsArray = Object.entries(studentEvaluations)
      .filter(([_, evaluation]) => evaluation !== null)
      .map(([studentId, evaluation]) => ({
        studentId,
        evaluation: evaluation!.evaluation,
        mark: evaluation!.mark,
      }));

    if (evaluationsArray.length === 0) {
      toast({
        title: "No Evaluations",
        description: "Please select evaluations for at least one student.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  // Handle confirmed batch save
  const handleConfirmedSave = async () => {
    setShowConfirmDialog(false);

    const evaluationsArray = Object.entries(studentEvaluations)
      .filter(([_, evaluation]) => evaluation !== null)
      .map(([studentId, evaluation]) => ({
        studentId,
        evaluation: evaluation!.evaluation,
        mark: evaluation!.mark,
      }));

    try {
      setSavingStudentId("batch_saving"); // Use a special ID for batch saving

      const batchData: BulkBatchEvaluationData = {
        evaluations: evaluationsArray,
        subject: selectedSubject?.subject || "",
        class: selectedSubject?.class || 0,
        tId: teacherId || "",
      };

      const result = await saveBulkBatchEvaluations(batchData);

      if (result.success) {
        toast({
          title: "✅ Bulk Evaluations Saved",
          description: `Successfully saved ${result.data.summary.successful} out of ${result.data.summary.total} evaluations`,
          duration: 4000,
        });

        if (result.data.errors.length > 0) {
          toast({
            title: "⚠️ Some Errors Occurred",
            description: `${result.data.errors.length} evaluations failed to save. Check console for details.`,
            variant: "destructive",
            duration: 6000,
          });
          console.error("Bulk evaluation errors:", result.data.errors);
        }

        onEvaluationComplete?.();
        onClose();
      } else {
        toast({
          title: "❌ Save Failed",
          description:
            result.message ||
            "Could not save bulk evaluations. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Bulk batch evaluation error:", error);
      toast({
        title: "❌ Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save bulk evaluations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingStudentId(null);
    }
  };

  // Get current students list based on mode
  const currentStudents = remainingStudents;
  const sortedStudents = currentStudents.sort((a, b) => {
    return a.rollNumber - b.rollNumber;
  });

  // Calculate statistics
  const totalStudents = initialStudents.length;
  const evaluatedCount =
    evaluationMode === "batch"
      ? Object.keys(studentEvaluations).filter(
          (key) => studentEvaluations[key] !== null
        ).length
      : totalStudents - remainingStudents.length;
  const remainingCount =
    evaluationMode === "batch"
      ? totalStudents - evaluatedCount
      : remainingStudents.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-screen overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                {evaluationMode === "batch" ? (
                  <>
                    <Package className="h-5 w-5" /> Batch Evaluation
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" /> Indiv. Evaluation
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedSubject && (
                  <>
                    Evaluate students for {selectedSubject.subject} - Class{" "}
                    {selectedSubject.class}
                  </>
                )}
              </DialogDescription>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                <span>Batch</span>
                <Switch
                  checked={evaluationMode === "individual"}
                  onCheckedChange={handleModeToggle}
                />
                <span>Individual</span>
                <Zap className="h-4 w-4" />
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Description & Statistics */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {evaluationMode === "batch" ? (
                  <>
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      Batch Mode
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-gray-900">
                      Individual Mode
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1  flex-nowrap truncate"
                >
                  <Users className="h-3 w-3" />
                  {totalStudents} ttl.
                </Badge>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1  flex-nowrap truncate"
                >
                  <Clock className="h-3 w-3" />
                  {evaluatedCount} eval.
                </Badge>
                <Badge
                  variant="default"
                  className="flex items-center gap-1 flex-nowrap truncate"
                >
                  {remainingCount} rmin.
                </Badge>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {evaluationMode === "batch"
                ? "Select evaluations for all students, then click 'Save All Evaluations' to save them together."
                : "Click any grade to immediately save and remove that student from the list. Perfect for quick evaluations."}
            </p>
          </div>

          {/* Action Buttons (only for batch mode) */}
          {evaluationMode === "batch" && (
            <div className="flex flex-col justify-between items py-3 gap-2">
              <div className="text-sm text-gray-600">
                Progress: {evaluatedCount}/{totalStudents} students evaluated
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Select for All:
                </span>
                <div className="flex gap-2">
                  {gradingLevels.map((level) => (
                    <Button
                      key={level.name}
                      onClick={() => handleGradeForAll(level)}
                      size="sm"
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all text-2xl"
                      style={{
                        background: `linear-gradient(135deg, ${level.color}90, ${level.color})`,
                        color: "white",
                      }}
                    >
                      <span className="text-sm">
                        {level.emoji || getDefaultEmoji(level.name)}
                      </span>
                      {/* <span className="text-xs">{level.name}</span> */}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Students List */}
          <ScrollArea className="h-[600px] border rounded-xl p-4 bg-white shadow-inner">
            {sortedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">
                  {evaluationMode === "individual" ? "🎉" : "👥"}
                </div>
                <div className="text-lg font-medium">
                  {evaluationMode === "individual"
                    ? "All Students Evaluated!"
                    : "No students found"}
                </div>
                <div className="text-sm">
                  {evaluationMode === "individual"
                    ? "Great job! All students have been evaluated."
                    : "Please check your student list"}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStudents.map((student) => {
                  const selectedEvaluation = studentEvaluations[student._id];

                  return (
                    <div
                      key={student._id}
                      className={`
                      flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all duration-200 relative
                      ${
                        selectedEvaluation
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200"
                          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                      }
                      ${
                        savingStudentId === student._id
                          ? "opacity-75 pointer-events-none"
                          : ""
                      }
                    `}
                    >
                      {/* Student Info */}
                      <div className="flex-1 flex justify-between space-x-3">
                        <div>
                          <div>
                            <div className="font-medium text-gray-500 flex items-center justify-start gap-1">
                              <p className="w-7 text-xs">#{student.adNumber}</p>
                              {selectedEvaluation && (
                                <div className="max-w-11">
                                  <div className="text-[10px] truncate font-medium text-blue-600 bg-blue-100 px-2 rounded-full">
                                    {selectedEvaluation.evaluation
                                      .charAt(0)
                                      .toUpperCase() +
                                      selectedEvaluation.evaluation.slice(1)}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="font-medium text-gray-900 max-w-20 md:max-w-full truncate">
                              {student.name}
                            </div>
                          </div>
                        </div>

                        {/* Grading Buttons */}
                        <div className="flex flex-wrap gap-1 items-center justify-end">
                          {savingStudentId === student._id && (
                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                              <div className="flex items-center gap-2 text-blue-600 font-medium">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                Saving...
                              </div>
                            </div>
                          )}

                          {gradingLevels.map((level) => {
                            const isSelected =
                              evaluationMode === "batch" &&
                              selectedEvaluation?.evaluation ===
                                level.name.toLowerCase();
                            const isDisabled = savingStudentId === student._id;

                            return (
                              <button
                                key={level.name}
                                onClick={() =>
                                  handleStudentEvaluation(student._id, level)
                                }
                                disabled={isDisabled}
                                className={`
                              w-9 h-9 rounded-xl flex items-center justify-center transition-all text-2xl
                              ${
                                isSelected
                                  ? "ring-3 ring-blue-500 ring-offset-2 scale-105 shadow-lg"
                                  : "hover:scale-105 hover:shadow-md"
                              }
                              ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }
                            `}
                                style={{
                                  background: `${
                                    evaluationMode === "individual"
                                      ? `linear-gradient(135deg, ${level.color}90, ${level.color})`
                                      : isSelected
                                      ? `linear-gradient(135deg, ${level.color}90, ${level.color})`
                                      : `linear-gradient(135deg, rgb(166 172 182), rgb(166 172 182))`
                                  }`,
                                  boxShadow: isSelected
                                    ? `0 8px 25px rgba(59, 130, 246, 0.3)`
                                    : "0 2px 8px rgba(0,0,0,0.1)",
                                }}
                                title={`${level.name} (${level.mark} marks)${
                                  evaluationMode === "individual"
                                    ? " - Click to save immediately"
                                    : ""
                                }`}
                              >
                                <span className="filter drop-shadow-sm text-base">
                                  {level.emoji || getDefaultEmoji(level.name)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {evaluationMode === "individual" && remainingStudents.length === 0
                ? "Done"
                : "Cancel"}
            </Button>

            {evaluationMode === "batch" && (
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  Object.keys(studentEvaluations).length === 0 ||
                  savingStudentId === "batch_saving"
                }
              >
                {savingStudentId === "batch_saving" ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </div>
                ) : (
                  `Save All Evaluations (${evaluatedCount})`
                )}
              </Button>
            )}

            {evaluationMode === "individual" && (
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700"
                disabled={remainingStudents.length > 0}
              >
                Complete ({totalStudents - remainingStudents.length}/
                {totalStudents})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
 
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-transparent border-0 shadow-none">
          <div className="rounded-lg mx-3 justify-center bg-white p-6 shadow-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Confirm Bulk Evaluation Save
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <div>
                  You are about to save <strong>{evaluatedCount}</strong>{" "}
                  student evaluations for{" "}
                  <strong>{selectedSubject?.subject}</strong> - Class{" "}
                  <strong>{selectedSubject?.class}</strong>.
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  This action cannot be undone. All selected evaluations will be
                  permanently saved to the database.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-center items-center gap-3">
              <AlertDialogCancel className="m-0">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmedSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save All Evaluations
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
