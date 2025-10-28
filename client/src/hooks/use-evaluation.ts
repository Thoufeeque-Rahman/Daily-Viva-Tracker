import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Student } from "@/types";
import { apiRequest } from "@/lib/queryClient";

interface UseEvaluationProps {
  selectedClassId?: number;
  selectedSubjectId?: number;
  students: Student[];
  puzzleFrequency?: number; // Number of evaluations before showing puzzle
}

export function useEvaluation({
  selectedClassId,
  selectedSubjectId,
  students,
  puzzleFrequency = 5,
}: UseEvaluationProps) {
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [currentEvaluation, setCurrentEvaluation] = useState<'poor' | 'good' | 'great' | null>(null);
  const [punishmentModalOpen, setPunishmentModalOpen] = useState(false);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);
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
    const success = (await submitEvaluation(0, punishment)) || false;
    setPunishmentModalOpen(false);
    
    if (success) {
      toast({
        title: "Poor evaluation recorded",
        variant: "destructive",
      });
      
      const newCount = evaluationCount + 1;
      setEvaluationCount(newCount);
      
      // Check if we should show puzzle
      if (newCount % puzzleFrequency === 0) {
        setShowPuzzle(true);
      } else {
        moveToNextStudent();
      }
    }
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
    
    let success = false;
    
    if (currentEvaluation === 'good') {
      success = (await submitEvaluation(1)) || false;
      if (success) {
        toast({
          title: "Good evaluation recorded",
          variant: "default",
        });
      }
    } else if (currentEvaluation === 'great') {
      success = (await submitEvaluation(2)) || false;
      if (success) {
        toast({
          title: "Great evaluation recorded",
          variant: "default",
        });
      }
    }
    
    if (success) {
      const newCount = evaluationCount + 1;
      setEvaluationCount(newCount);
      
      // Check if we should show puzzle
      if (newCount % puzzleFrequency === 0) {
        setShowPuzzle(true);
      } else {
        moveToNextStudent();
      }
    }
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
      // This will be handled by the parent component's submitEvaluation function
      // For now, just return true to continue the flow
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

  const handlePuzzleSolved = () => {
    setShowPuzzle(false);
    moveToNextStudent();
  };

  const handlePuzzleSkipped = () => {
    setShowPuzzle(false);
    moveToNextStudent();
  };

  return {
    currentStudent,
    currentStudentIndex,
    totalStudents: students.length,
    currentEvaluation,
    punishmentModalOpen,
    showPuzzle,
    evaluationCount,
    puzzleFrequency,
    isNextEnabled: !!currentEvaluation && currentEvaluation !== 'poor',
    handleEvaluate,
    handlePunishmentSubmit,
    handlePunishmentCancel,
    handleSkip,
    handleNext,
    handlePuzzleSolved,
    handlePuzzleSkipped,
    setPunishmentModalOpen,
  };
}
