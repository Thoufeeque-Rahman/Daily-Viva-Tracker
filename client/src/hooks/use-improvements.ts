import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

export interface Improvement {
  _id: string;
  student: {
    _id: string;
    name: string;
    rollNumber: string;
    adNumber: string;
  };
  teacher: string;
  subject: string;
  class: number;
  description: string;
  dueDate: string;
  status: 'given' | 'done';
  assignedAt: string;
  completedAt?: string;
}

export function useImprovements(subject?: string, classNumber?: number) {
  return useQuery({
    queryKey: ['improvements', subject, classNumber],
    queryFn: async () => {
      if (!subject || !classNumber) return [];
      const { data } = await axios.get(`/api/improvements/subject/${subject}/class/${classNumber}`);
      return data as Improvement[];
    },
    enabled: !!(subject && classNumber),
  });
}

export function useStudentImprovements(studentId?: string, subject?: string, classNumber?: number) {
  return useQuery({
    queryKey: ['student-improvements', studentId, subject, classNumber],
    queryFn: async () => {
      if (!studentId || !subject || !classNumber) return [];
      const { data } = await axios.get(`/api/improvements/student/${studentId}/subject/${subject}/class/${classNumber}`);
      return data as Improvement[];
    },
    enabled: !!(studentId && subject && classNumber),
  });
}

export function useToggleImprovementStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (improvementId: string) => {
      const { data } = await axios.patch(`/api/improvements/${improvementId}/toggle-status`);
      return data as Improvement;
    },
    onSuccess: (updatedImprovement) => {
      // Update the cache with the new status
      queryClient.setQueryData(
        ['improvements', updatedImprovement.subject, updatedImprovement.class],
        (oldData: Improvement[] | undefined) => {
          if (!oldData) return [updatedImprovement];
          return oldData.map(improvement =>
            improvement._id === updatedImprovement._id ? updatedImprovement : improvement
          );
        }
      );

      // Also invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['improvements'] });
      queryClient.invalidateQueries({ queryKey: ['student-improvements'] });
    },
  });
}

export function useCreateImprovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (improvement: {
      studentId: string;
      subject: string;
      class: number;
      description: string;
      dueDate: string;
    }) => {
      const { data } = await axios.post('/api/improvements', improvement);
      return data as Improvement;
    },
    onSuccess: (newImprovement) => {
      // Update the cache optimistically
      queryClient.setQueryData(
        ['improvements', newImprovement.subject, newImprovement.class],
        (oldData: Improvement[] | undefined) => {
          return oldData ? [...oldData, newImprovement] : [newImprovement];
        }
      );

      // Also invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['improvements'] });
      queryClient.invalidateQueries({ queryKey: ['student-improvements'] });
    },
  });
}

export function useUpdateImprovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; description: string; dueDate: string }) => {
      const { data } = await axios.put(`/api/improvements/${id}`, updates);
      return data as Improvement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvements'] });
      queryClient.invalidateQueries({ queryKey: ['student-improvements'] });
    },
  });
}

export function useDeleteImprovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (improvementId: string) => {
      await axios.delete(`/api/improvements/${improvementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improvements'] });
      queryClient.invalidateQueries({ queryKey: ['student-improvements'] });
    },
  });
}