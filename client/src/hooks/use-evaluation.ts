import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Student } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface UseEvaluationProps {
  selectedClassId?: number;
  selectedSubjectId?: number;
  students: Student[];
}

export function useEvaluation({
  selectedClassId,
  selectedSubjectId,
  students,
}: UseEvaluationProps) {
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<'poor' | 'good' | 'great' | null>(null);
  const [punishmentModalOpen, setPunishmentModalOpen] = useState(false);
  const { toast } = useToast();

  // Get current student
  const currentStudent = students[currentStudentIndex];
  
  const handleEvaluate = (value: 'poor' | 'good' | 'great') => {
    setCurrentEvaluation(value);
    
    if (value === 'poor') {
      setPunishmentModalOpen(true);
    }
  };
  
  const handlePunishmentSubmit = async (punishment: string) => {
    await submitEvaluation(0, punishment);
    setPunishmentModalOpen(false);
    
    toast({
      title: "Poor evaluation recorded",
      variant: "destructive",
    });
  };
  
  const handlePunishmentCancel = () => {
    setPunishmentModalOpen(false);
    setCurrentEvaluation(null);
  };
  
  const handleSkip = () => {
    // Move to next student
    if (students.length > 0) {
      moveToNextStudent();
    }
  };
  
  const handleNext = async () => {
    if (!currentStudent) return;
    
    if (currentEvaluation === 'good') {
      await submitEvaluation(1);
      toast({
        title: "Good evaluation recorded",
        variant: "default",
      });
    } else if (currentEvaluation === 'great') {
      await submitEvaluation(2);
      toast({
        title: "Great evaluation recorded",
        variant: "success",
      });
    }
    
    moveToNextStudent();
  };
  
  const moveToNextStudent = () => {
    if (students.length > 0) {
      // Get random index excluding current one
      const nextIndex = getRandomStudentIndex();
      setCurrentStudentIndex(nextIndex);
      setCurrentEvaluation(null);
    }
  };
  
  const getRandomStudentIndex = () => {
    if (students.length <= 1) return 0;
    
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * students.length);
    } while (nextIndex === currentStudentIndex);
    
    return nextIndex;
  };
  
  const submitEvaluation = async (mark: number, punishment?: string) => {
    if (!selectedClassId || !selectedSubjectId || !currentStudent) return;
    
    try {
      await apiRequest('POST', '/api/evaluations', {
        studentId: currentStudent.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        mark,
        punishment: punishment || null,
      });
      
      // Invalidate queries if needed
      queryClient.invalidateQueries({ 
        queryKey: ['/api/evaluations'] 
      });
      
      return true;
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      toast({
        title: "Failed to save evaluation",
        description: "Please try again",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    currentStudent,
    currentStudentIndex,
    totalStudents: students.length,
    currentEvaluation,
    punishmentModalOpen,
    isNextEnabled: !!currentEvaluation && currentEvaluation !== 'poor',
    handleEvaluate,
    handlePunishmentSubmit,
    handlePunishmentCancel,
    handleSkip,
    handleNext,
    setPunishmentModalOpen,
  };
}
