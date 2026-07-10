import { useEffect, useState } from "react";
import { useEvaluationLogic } from "../hooks/useEvaluationLogic";
import { applyGradePalette, DEFAULT_GRADE_PALETTE } from "../theme/gradeTheme";
import { StudentHistoryModal } from "@/components/StudentHistoryModal";
import { ImprovementModal } from "@/components/ImprovementModal";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  SkipForward, 
  History, 
  BookOpen, 
  GraduationCap, 
  User, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

const GRADE_LEVELS = [
  { name: "Excellent", key: "excellent", mark: 4, emoji: "😊" },
  { name: "Good", key: "good", mark: 3, emoji: "🙂" },
  { name: "Satisfactory", key: "satisfactory", mark: 2, emoji: "😐" },
  { name: "Needs Imp.", key: "improve", mark: 1, emoji: "🙁" },
  { name: "Poor", key: "poor", mark: 0, emoji: "☹️" },
] as const;

export default function Evaluation() {
  const {
    currentStudent,
    setCurrentStudent,
    currentEvaluation,
    students,
    rounds,
    isLoadingNextStudent,
    isSavingEvaluation,
    handleEvaluate,
    handleNext,
    handleFinish,
    selectedSubject,
    pickRandomStudent,
  } = useEvaluationLogic();

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);

  // Initialize custom property grade colors on mount
  useEffect(() => {
    applyGradePalette(DEFAULT_GRADE_PALETTE);
  }, []);

  if (!selectedSubject) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-brass mx-auto animate-bounce" />
          <h2 className="text-xl font-bold">No Subject Selected</h2>
          <p className="text-sm text-ink/70">Please start an evaluation from the home dashboard.</p>
          <Button onClick={handleFinish} className="bg-brass text-white hover:bg-brass/90">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalStudents = students.length;
  const studentsNotAsked = rounds[0]?.studentsNotAsked.length || 0;
  const studentsAsked = Math.max(0, totalStudents - studentsNotAsked);
  const progressPercent = totalStudents > 0 ? (studentsAsked / totalStudents) * 100 : 0;

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-ink/10 bg-white/40 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleFinish}
              className="p-2 rounded-lg hover:bg-ink/5 text-ink/80 transition-colors"
              title="Go back to Home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-brass">
                V2 Evaluation Portal
              </span>
              <h1 className="text-lg font-bold text-ink flex items-center gap-2 mt-0.5">
                {selectedSubject.subject}
                <span className="px-2 py-0.5 text-xs rounded bg-ink/10 text-ink/80 font-normal">
                  Class {selectedSubject.class}
                </span>
              </h1>
            </div>
          </div>
          
          <Button 
            onClick={handleFinish} 
            variant="outline"
            className="border-ink/20 text-ink hover:bg-ink/5 rounded-xl font-medium"
          >
            Finish Round
          </Button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar - Desktop only */}
        <aside className="hidden lg:block w-[220px] shrink-0 border-r border-ink/10 bg-white/20 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50 flex items-center gap-1.5 px-2">
              <GraduationCap className="w-4 h-4 text-brass" />
              Student List
            </h2>
          </div>
          <nav className="space-y-1">
            {students.map((student) => {
              const isCurrent = currentStudent?._id === student._id;
              const isRemaining = rounds[0]?.studentsNotAsked.includes(student._id);
              
              return (
                <button
                  key={student._id}
                  onClick={() => setCurrentStudent(student)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between transition-all ${
                    isCurrent 
                      ? "bg-ink text-white font-semibold shadow-md" 
                      : "text-ink/80 hover:bg-ink/5"
                  }`}
                >
                  <span className="truncate flex-1 pr-2">
                    {student.name}
                  </span>
                  {isRemaining && (
                    <span 
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${isCurrent ? 'bg-brass' : 'bg-brass animate-pulse'}`}
                      title="Available for questioning"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Work Area */}
        <main className="flex-1 p-6 md:p-8 flex flex-col justify-between max-w-3xl mx-auto w-full">
          
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-sm mb-2 font-medium">
              <span className="text-ink/60">Session Progress</span>
              <span className="text-ink font-semibold">
                {studentsAsked} of {totalStudents} Evaluated
              </span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-ink/10" />
          </div>

          {/* Active Student Card */}
          <div className="flex-1 flex flex-col justify-center mb-8">
            {currentStudent ? (
              <div className="bg-white/80 border border-ink/10 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Student Identity */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-full bg-ink/5 border border-ink/10 flex items-center justify-center text-2xl font-bold text-brass shrink-0 shadow-inner">
                    {currentStudent.photoUrl ? (
                      <img 
                        src={currentStudent.photoUrl} 
                        alt={currentStudent.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      currentStudent.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold tracking-tight text-ink">
                      {currentStudent.name}
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-ink/5 text-ink/75">
                        Roll: {currentStudent.rollNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-ink/5 text-ink/75">
                        Ad. No: {currentStudent.adNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auxiliary Controls */}
                <div className="grid grid-cols-3 gap-3 border-t border-ink/5 pt-5">
                  <button
                    onClick={async () => {
                      setIsLoadingNextStudent(true);
                      await pickRandomStudent(rounds);
                      setIsLoadingNextStudent(false);
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-ink/5 text-ink/80 hover:bg-ink/10 transition-colors text-xs font-semibold"
                  >
                    <SkipForward className="w-4 h-4 text-brass" />
                    Skip Student
                  </button>
                  <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-ink/5 text-ink/80 hover:bg-ink/10 transition-colors text-xs font-semibold"
                  >
                    <History className="w-4 h-4 text-brass" />
                    View History
                  </button>
                  <button
                    onClick={() => setIsImprovementModalOpen(true)}
                    className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-ink/5 text-ink/80 hover:bg-ink/10 transition-colors text-xs font-semibold"
                  >
                    <BookOpen className="w-4 h-4 text-brass" />
                    Assign Task
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white/40 border border-dashed border-ink/20 rounded-3xl p-12 text-center space-y-4">
                <User className="w-12 h-12 text-ink/20 mx-auto animate-pulse" />
                <h3 className="font-bold">No Student Selected</h3>
                <p className="text-sm text-ink/60">
                  Select a student from the list or click below to pick a random candidate.
                </p>
                <Button 
                  onClick={async () => { await pickRandomStudent(rounds); }} 
                  className="bg-brass text-white hover:bg-brass/90"
                >
                  Pick Candidate
                </Button>
              </div>
            )}
          </div>

          {/* Grading Input Controls */}
          {currentStudent && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/60 px-1">
                Evaluate Performance:
              </h3>
              
              {/* Grading Buttons Grid - 2x2 with 5th button below */}
              <div className="grid grid-cols-2 gap-3.5">
                {GRADE_LEVELS.slice(0, 4).map((level) => {
                  const isSelected = currentEvaluation === level.key;
                  return (
                    <button
                      key={level.key}
                      style={{ backgroundColor: `var(--grade-${level.key})` }}
                      disabled={isSavingEvaluation || isLoadingNextStudent}
                      onClick={() => handleEvaluate(level.key, level.mark)}
                      className={`flex items-center justify-between p-4 rounded-2xl border border-ink/10 text-ink text-left shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold block">{level.name}</span>
                        <span className="text-xs text-ink/60">Mark: {level.mark}</span>
                      </div>
                      <span className="text-3xl filter drop-shadow">{level.emoji}</span>
                    </button>
                  );
                })}

                {/* 5th button spanning full width */}
                {GRADE_LEVELS.slice(4).map((level) => {
                  const isSelected = currentEvaluation === level.key;
                  return (
                    <button
                      key={level.key}
                      style={{ backgroundColor: `var(--grade-${level.key})` }}
                      disabled={isSavingEvaluation || isLoadingNextStudent}
                      onClick={() => handleEvaluate(level.key, level.mark)}
                      className="col-span-2 flex items-center justify-between p-4 rounded-2xl border border-ink/10 text-ink text-left shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold block">{level.name}</span>
                        <span className="text-xs text-ink/60">Mark: {level.mark}</span>
                      </div>
                      <span className="text-3xl filter drop-shadow">{level.emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Legacy Modals Integration */}
      {currentStudent && (
        <>
          <StudentHistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            student={currentStudent}
            subject={selectedSubject.subject}
            classNumber={selectedSubject.class}
          />
          <ImprovementModal
            isOpen={isImprovementModalOpen}
            onClose={() => setIsImprovementModalOpen(false)}
            student={currentStudent}
            subject={selectedSubject.subject}
            classNumber={selectedSubject.class}
            onSuccess={() => {
              // Trigger reload or notification
            }}
          />
        </>
      )}
    </div>
  );
}
