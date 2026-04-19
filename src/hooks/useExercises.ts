import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Exercise, PageExerciseRead } from '../types/api';

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await api.get<PageExerciseRead>('/exercises/');
      return response.data?.items || [];
    },
    staleTime: Infinity, // Exercises change rarely
  });
}

export function useExercise(id: number | null) {
  return useQuery<Exercise>({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const response = await api.get<Exercise>(`/exercises/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}
