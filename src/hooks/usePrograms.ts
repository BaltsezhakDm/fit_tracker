import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { TrainingProgram } from '../types/api';

export function usePrograms(userId: number) {
  return useQuery<TrainingProgram[]>({
    queryKey: ['programs', userId],
    queryFn: async () => {
      const response = await api.get(`/programs/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: Omit<TrainingProgram, 'id'>) => {
      const response = await api.post('/programs/', program);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
