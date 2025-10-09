import { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ThumbsDown,
  ThumbsUp,
  Star,
  Moon,
  EllipsisVertical,
} from "lucide-react";
import StudentCard from "./StudentCard";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Label } from "@radix-ui/react-label";
import { useActiveGradingConfig, getDefaultGradingLevels } from "@/hooks/use-grading-config";
import { GradingLevel } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

interface EvaluationScreenProps {
  currentStudent: Student | undefined;
  currentIndex: number;
  totalStudents: number;
  studentsNot: number;
  currentEvaluation: string | null;
  setCurrentEvaluation: (evaluation: string) => void;
  onEvaluate: (value: string, mark: number) => void;
  onSkip: () => void;
  onEnd: () => void;
  onNext: (value: string, mark: number) => void;
  onFinish: () => void;
  setPunishmentModalOpen: (open: boolean) => void;
  isNextEnabled: boolean;
  allStudents: Student[];
  onStudentSelect?: (student: Student) => void;
  onForceStop?: () => void;
}

export default function EvaluationScreen({
  currentStudent,
  currentIndex,
  totalStudents,
  studentsNot,
  currentEvaluation,
  setCurrentEvaluation,
  onEvaluate,
  onSkip,
  onEnd,
  onNext,
  onFinish,
  setPunishmentModalOpen,
  isNextEnabled,
  allStudents,
  onStudentSelect,
}: EvaluationScreenProps) {
  const [studentKey, setStudentKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Get active grading configuration
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || getDefaultGradingLevels();

  // Utility functions for styling
  const getGradientClass = (color: string) => {
    const colorMap: Record<string, string> = {
      '#16a34a': 'bg-gradient-to-r from-emerald-500 to-green-600',
      '#e88d8d': 'bg-gradient-to-r from-yellow-500 to-amber-600',
      '#dc2626': 'bg-gradient-to-r from-rose-500 to-red-600',
      '#4ce600': 'bg-gradient-to-r from-blue-500 to-blue-600',
      '#d97706': 'bg-gradient-to-r from-purple-500 to-purple-600',
      '#EC4899': 'bg-gradient-to-r from-pink-500 to-pink-600',
    };
    return colorMap[color] || `bg-gradient-to-r from-gray-500 to-gray-600`;
  };

  const getRingClass = (color: string) => {
    const colorMap: Record<string, string> = {
      '#16a34a': 'ring-emerald-500',
      '#e88d8d': 'ring-yellow-500',
      '#dc2626': 'ring-red-500',
      '#4ce600': 'ring-blue-500',
      '#d97706': 'ring-purple-500',
      '#EC4899': 'ring-pink-500',
    };
    return colorMap[color] || 'ring-gray-500';
  };

  const getDefaultEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('great') || lowerName.includes('excellent')) return '😊';
    if (lowerName.includes('good') || lowerName.includes('average')) return '🙂';
    if (lowerName.includes('poor') || lowerName.includes('bad')) return '☹️';
    return '😐';
  };

  // Filter students based on search query
  console.log(allStudents);
  const filteredStudents = allStudents.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update key when student changes to trigger animation
  useEffect(() => {
    setStudentKey((prevKey) => prevKey + 1);
  }, [currentStudent]);

  var studentsAskedNumber = Math.abs(studentsNot - totalStudents);

  const progressPercent =
    totalStudents > 0 // totalStudents
      ? (studentsAskedNumber / totalStudents) * 100 // totalStudents
      : 0;

  return (
    <div className="p-6 transition-all duration-300 transform flex flex-col justify-between h-full">
      {/* Progress Indicator */}
      <div className="mb-4 flex gap-4">
        <div className="flex-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Evaluated Students</span>
            <span className="text-sm font-medium">
              {totalStudents > 0
                ? `${studentsAskedNumber} of ${totalStudents}`
                : "Loading..."}{" "}
              {/* totalStudents */}
            </span>
          </div>
          <Progress value={progressPercent} className="w-full h-2.5 shadow-lg" />
        </div>
        <div className="flex-none">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 p-0 bg-secondary hover:bg-secondary/50 focus:bg-secondary/50">
                <EllipsisVertical className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    Force close round & move to next
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will immediately end the current evaluation
                      round. This action cannot be undone and any unsaved
                      progress will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onEnd}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Force Close
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem onClick={onFinish}>
                Finish Evaluation
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <Input
          className="mb-6 rounded-xl bg-gradient-to-br shadow-lg from-blue-50 to-indigo-100 text-indigo-500 font-medium placeholder:text-indigo-500/90 border-blue-600 hover:bg-blue-100 hover:text-indigo-500 hover:border-blue-600 focus:bg-blue-100 focus:text-indigo-500 focus:border-blue-600 focus:outline-none"
          placeholder="🔎 Search Student"
          value={searchQuery.toUpperCase()}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          onBlur={() => {
            // Small delay to allow click events on the results
            setTimeout(() => setShowSearchResults(false), 200);
          }}
        />
        {showSearchResults && (
          <div className="absolute w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {(searchQuery ? filteredStudents : allStudents).map((student) => (
              <div
                key={student._id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  if (onStudentSelect) {
                    onStudentSelect(student);
                  }
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
              >
                {student.name} ({student.rollNumber})
              </div>
            ))}
            {searchQuery && filteredStudents.length === 0 && (
              <div className="p-2 text-gray-500">No students found</div>
            )}
          </div>
        )}
      </div>

      {/* Student Card */}
      <div
        key={studentKey}
        className="transform transition-transform duration-300 mb-auto"
      >
        <StudentCard student={currentStudent} animate />
      </div>

      {/* Evaluation Buttons */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Evaluate Student:
        </h4>
        <div className={`grid gap-3 ${gradingLevels.length <= 3 ? 'grid-cols-3' : gradingLevels.length === 4 ? 'grid-cols-2' : gradingLevels.length === 5 ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {gradingLevels.map((level, index) => {
            const isSelected = currentEvaluation === level.name.toLowerCase();
            const gradientClass = getGradientClass(level.color);
            const ringClass = getRingClass(level.color);
            
            return (
              <button
                key={level.name}
                style={{ background: `linear-gradient(to right, ${level.color}80, ${level.color})`}}
                className={`flex flex-col items-center p-3 rounded-xl shadow-lg transition-all ${
                  isSelected ? `ring-2 ${ringClass}` : ""
                }`}
                onClick={() => {
                  const evaluation = level.name.toLowerCase();
                  onEvaluate(evaluation, level.mark);
                  setCurrentEvaluation(evaluation);
                }}
              > 
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-1">
                  <span className="text-white text-4xl">{level.emoji || getDefaultEmoji(level.name)}</span>
                </div>  
                <span className="text-base font-medium text-white">{level.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      {/* <div className="flex space-x-3 mb-3">
        {status !== "great" && (
          <Button
            variant="destructive"
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium transition-colors"
            onClick={() => setPunishmentModalOpen(true)}
          >
            Punishment
          </Button>
        )}
      </div> */}

      <div className="flex space-x-3 w-full bg-white p-4 z-10 border-t border-gray-200">
        <div className="flex flex-wrap w-full max-w-xl mx-auto">
          <div className="flex w-full space-x-3">
            <Button
              variant="outline"
              className="flex-1 py-3 bg-blue-500 text-white shadow-md rounded-xl border-0 font-medium hover:bg-blue-500 hover:text-white transition-colors"
              onClick={onSkip}
            >
              Skip
            </Button> 
            <Button
              variant="outline"
              className="flex-1 py-3 bg-red-500 shadow-md rounded-xl text-white border-0 font-medium hover:bg-destructive hover:text-white transition-colors"
              onClick={onFinish}
            >
              Finish Evaluation
            </Button>
            {/* <div>
              <Button
                variant="outline"
                className="flex-1 py-3 border border-yellow-600 text-yellow-600 rounded-full w-fit font-medium hover:bg-yellow-600 hover:text-white transition-colors"
                onClick={onEnd}
                disabled={true}
              >
                ER?
              </Button>
            </div> */}
          </div>
          <div className="flex w-full"></div>
        </div>
      </div>

      {/* Finish Button
      <div className="mt-8">
        <Button
          variant="outline"
          className="flex-1 py-3 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive hover:text-white transition-colors"
          onClick={onFinish}
        >
          Finish Evaluation
        </Button>
      </div> */}
    </div>
  );
}
