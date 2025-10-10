import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Student } from "@/types";
import { useActiveGradingConfig } from "@/hooks/use-grading-config";
import { getMarkEmoji } from "@/lib/grading-utils";

interface AskMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onEvaluate: (mark: number) => void;
  subject: string;
  class: number;
}

export function AskMeModal({ isOpen, onClose, student, onEvaluate, subject, class: classNumber }: AskMeModalProps) {
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Evaluation for {subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase()} in Class {classNumber}</DialogTitle>
        </DialogHeader>
        
        {/* Student Details */}
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{student.name}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>Roll Number:</div>
              <div>{student.rollNumber}</div>
              <div>Admission Number:</div>
              <div>{student.adNumber}</div>
            </div>
          </div>
        </div>

        {/* Evaluation Buttons */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Evaluate Student:
          </h4>
          <div className={`grid gap-3 ${gradingLevels.length <= 7 && 'grid-cols-3'}`}>
            {gradingLevels
              .sort((a, b) => b.mark - a.mark) // Sort from highest to lowest mark
              .map((level) => {
                const getHoverColor = (color: string) => {
                  const colorMap: Record<string, string> = {
                    '#10B981': 'hover:bg-green-50',
                    '#F59E0B': 'hover:bg-yellow-50',
                    '#EF4444': 'hover:bg-red-50',
                    '#3B82F6': 'hover:bg-blue-50',
                    '#8B5CF6': 'hover:bg-purple-50',
                    '#EC4899': 'hover:bg-pink-50',
                  };
                  return colorMap[color] || 'hover:bg-gray-50';
                };

                return (
                  <button
                    key={level.mark}
                    className={`flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200 ${getHoverColor(level.color)} transition-all`}
                    onClick={() => {
                      onEvaluate(level.mark);
                      onClose();
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: level.color }}
                    >
                      <span className="text-white text-3xl">
                        {getMarkEmoji(level.mark, gradingLevels)}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{level.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 