import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { TrainingProgram, TrainingPlanRead, TrainingPlanCreate, PlanExerciseCreate } from '../types/api';

export function usePrograms() {
  return useQuery<TrainingProgram[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get<TrainingProgram[]>('/programs/');
      return response.data;
    },
  });
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: async (plan: TrainingPlanCreate) => {
      const response = await api.post<TrainingPlanRead>('/programs/plans', plan);
      return response.data;
    },
  });
}

export function useAddExerciseToPlan() {
  return useMutation({
    mutationFn: async ({ planId, exercise }: { planId: number; exercise: PlanExerciseCreate }) => {
      const response = await api.post(`/programs/plans/${planId}/exercises`, exercise);
      return response.data;
    },
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: Omit<TrainingProgram, 'id' | 'user_id'>) => {
      const response = await api.post<TrainingProgram>('/programs/', program);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}
