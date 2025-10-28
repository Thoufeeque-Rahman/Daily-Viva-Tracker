import { useState } from "react";
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
import { useActiveGradingConfig, getDefaultGradingLevels } from "@/hooks/use-grading-config";

interface BulkEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  selectedSubject?: { subject: string; class: number };
  onBulkEvaluate?: (studentEvaluations: Array<{ studentId: string; evaluation: string; mark: number }>) => void;
}

export function BulkEvaluationModal({
  isOpen,
  onClose,
  students,
  selectedSubject,
  onBulkEvaluate,
}: BulkEvaluationModalProps) {
  // Get active grading configuration
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || getDefaultGradingLevels();

  // State to track each student's selected evaluation
  const [studentEvaluations, setStudentEvaluations] = useState<Record<string, { evaluation: string; mark: number } | null>>({});

  // Helper function to get default emoji for grading levels without emoji
  const getDefaultEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('great') || lowerName.includes('excellent')) return '😊';
    if (lowerName.includes('good') || lowerName.includes('average')) return '🙂';
    if (lowerName.includes('poor') || lowerName.includes('bad')) return '☹️';
    return '😐';
  };

  // Handle individual student evaluation
  const handleStudentEvaluation = (studentId: string, level: GradingLevel) => {
    setStudentEvaluations(prev => ({
      ...prev,
      [studentId]: {
        evaluation: level.name.toLowerCase(),
        mark: level.mark
      }
    }));
  };

  // Handle "Excellent for All" button
  const handleExcellentForAll = () => {
    const excellentLevel = gradingLevels.find(level => 
      level.name.toLowerCase().includes('excellent') || 
      level.name.toLowerCase().includes('great')
    ) || gradingLevels[0]; // Default to first level if no "excellent" found

    const allEvaluations: Record<string, { evaluation: string; mark: number }> = {};
    students.forEach(student => {
      allEvaluations[student._id] = {
        evaluation: excellentLevel.name.toLowerCase(),
        mark: excellentLevel.mark
      };
    });
    setStudentEvaluations(allEvaluations);
  };

  // Handle save (placeholder for now)
  const handleSave = () => {
    if (onBulkEvaluate) {
      const evaluationsArray = Object.entries(studentEvaluations)
        .filter(([_, evaluation]) => evaluation !== null)
        .map(([studentId, evaluation]) => ({
          studentId,
          evaluation: evaluation!.evaluation,
          mark: evaluation!.mark
        }));
      
      onBulkEvaluate(evaluationsArray);
    }
    console.log('Bulk evaluations:', studentEvaluations);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Bulk Evaluation Entry
          </DialogTitle>
          <DialogDescription>
            {selectedSubject && (
              <>Evaluate all students for {selectedSubject.subject} - Class {selectedSubject.class}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-between items-center py-2">
            <div className="text-sm text-gray-600">
              {students.length} students • {Object.keys(studentEvaluations).filter(key => studentEvaluations[key] !== null).length} evaluated
            </div>
            <Button
              onClick={handleExcellentForAll}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 font-medium shadow-lg hover:shadow-xl transition-all"
            >
              ⭐ Excellent for All
            </Button>
          </div>

          {/* Students List */}
          <ScrollArea className="h-[400px] border rounded-xl p-4 bg-white shadow-inner">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-lg font-medium">No students found</div>
                <div className="text-sm">Please check your student list</div>
              </div>
            ) : (
              <div className="space-y-3">
              {students.map((student) => {
                const selectedEvaluation = studentEvaluations[student._id];
                
                return (
                  <div 
                    key={student._id}
                    className={`
                      flex items-center justify-between p-4 rounded-xl transition-all duration-200
                      ${selectedEvaluation 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }
                    `}
                  >
                    {/* Student Info */}
                    <div className="flex-1 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-600">Roll No: {student.rollNumber}</div>
                      </div>
                      {selectedEvaluation && (
                        <div className="ml-auto mr-4">
                          <div className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {selectedEvaluation.evaluation.charAt(0).toUpperCase() + selectedEvaluation.evaluation.slice(1)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grading Buttons */}
                    <div className="flex gap-2">
                      {gradingLevels.map((level) => {
                        const isSelected = selectedEvaluation?.evaluation === level.name.toLowerCase();
                        
                        return (
                          <button
                            key={level.name}
                            onClick={() => handleStudentEvaluation(student._id, level)}
                            className={`
                              w-12 h-12 rounded-full flex items-center justify-center transition-all text-2xl
                              ${isSelected 
                                ? 'ring-3 ring-blue-500 ring-offset-2 scale-110 shadow-lg' 
                                : 'hover:scale-105 hover:shadow-md'
                              }
                            `}
                            style={{ 
                              background: `linear-gradient(135deg, ${level.color}90, ${level.color})`,
                              boxShadow: isSelected ? '0 8px 25px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            title={`${level.name} (${level.mark} marks)`}
                          >
                            <span className="filter drop-shadow-sm">
                              {level.emoji || getDefaultEmoji(level.name)}
                            </span>
                          </button>
                        );
                      })}
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
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={Object.keys(studentEvaluations).length === 0}
            >
              Save Evaluations ({Object.keys(studentEvaluations).filter(key => studentEvaluations[key] !== null).length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}