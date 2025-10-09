import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, BookOpen } from "lucide-react";
import { Student, DvtMark } from "@/types";
import axios from "@/lib/axios";
import { useActiveGradingConfig, getDefaultGradingLevels } from "@/hooks/use-grading-config";
import { getMarkLabel, getMarkColors, getMarkEmoji } from "@/lib/grading-utils";

interface StudentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  subject: string;
  classNumber: number;
}

export function StudentHistoryModal({
  isOpen,
  onClose,
  student,
  subject,
  classNumber,
}: StudentHistoryModalProps) {
  const [marks, setMarks] = useState<DvtMark[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: gradingConfig } = useActiveGradingConfig();
  const gradingLevels = gradingConfig?.levels || getDefaultGradingLevels();

  useEffect(() => {
    if (isOpen && student && subject) {
      fetchStudentMarks();
    }
  }, [isOpen, student, subject, classNumber]);

  const fetchStudentMarks = async () => {
    setLoading(true);
    try {
      // Use the new specific endpoint for student marks history
      const response = await axios.get(`/api/dvtmarks/student/${student._id}/${encodeURIComponent(subject)}/${classNumber}`);

      console.log("Fetched student marks:", response.data);
      console.log("Student ID:", student._id, "Subject:", subject, "Class:", classNumber);
      
      // The data is already sorted by date (most recent first) and limited to 10 records from the server
      setMarks(response.data);
    } catch (error) {
      console.error("Error fetching student marks:", error);
      setMarks([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getAverageScore = () => {
    if (marks.length === 0) return 0;
    const total = marks.reduce((sum, mark) => sum + mark.mark, 0);
    return (total / marks.length).toFixed(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Recent Performance
          </DialogTitle>
          <DialogDescription>
            {student.name}'s recent marks in {subject} (Class {classNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{marks.length}</div>
              <div className="text-sm text-blue-800">Total Evaluations</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getAverageScore()}</div>
              <div className="text-sm text-green-800">Average Score</div>
            </div>
          </div>

          {/* Marks List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading marks...</p>
              </div>
            ) : marks.length > 0 ? (
              marks.map((mark, index) => {
                const colors = getMarkColors(mark.mark, gradingLevels);
                const emoji = getMarkEmoji(mark.mark, gradingLevels);
                const label = getMarkLabel(mark.mark, gradingLevels);

                return (
                  <div
                    key={mark._id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <Badge className={`${colors.bg} ${colors.text} ${colors.border}`}>
                          {label}
                        </Badge>
                        {mark.punishment && (
                          <p className="text-xs text-red-600 mt-1">
                            Punishment: {mark.punishment}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{mark.mark}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(mark.date)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Records Found</h3>
                <p className="text-sm text-gray-500">
                  No evaluations recorded for {student.name} in {subject} yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}