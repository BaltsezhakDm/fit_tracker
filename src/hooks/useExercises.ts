import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Exercise, PageExerciseRead } from '../types/api';

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await api.get<PageExerciseRead>('/exercises/');
      return response.data.items;
    },
    staleTime: Infinity, // Exercises change rarely
  });
}
