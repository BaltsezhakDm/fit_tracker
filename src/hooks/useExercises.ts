import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Exercise } from '../types/api';

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const response = await api.get('/exercises/');
      return response.data;
    },
    staleTime: Infinity, // Exercises change rarely
  });
}
