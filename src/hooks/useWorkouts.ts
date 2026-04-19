import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { WorkoutSession, WorkoutSet, WorkoutExercise, PageWorkoutSessionRead } from '../types/api';

export function useWorkouts() {
  return useQuery<WorkoutSession[]>({
    queryKey: ['workouts'],
    queryFn: async () => {
      const response = await api.get<PageWorkoutSessionRead>('/workouts/history');
      return response.data?.items || [];
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/workouts/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useWorkoutExercises(sessionId: string) {
  return useQuery<WorkoutExercise[]>({
    queryKey: ['workouts', sessionId, 'exercises'],
    queryFn: async () => {
      const response = await api.get<WorkoutExercise[]>(`/workouts/${sessionId}/exercises`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

export function useWorkoutSets(workoutExerciseId: string) {
  return useQuery<WorkoutSet[]>({
    queryKey: ['workout-exercises', workoutExerciseId, 'sets'],
    queryFn: async () => {
      const response = await api.get<WorkoutSet[]>(`/workouts/exercises/${workoutExerciseId}/sets`);
      return response.data;
    },
    enabled: !!workoutExerciseId,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId }: { planId?: number }) => {
      const response = await api.post<WorkoutSession>('/workouts/start', null, {
        params: { plan_id: planId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useAddExerciseToSession() {
  return useMutation({
    mutationFn: async ({ sessionId, exerciseId }: { sessionId: string; exerciseId: number }) => {
      const response = await api.post<WorkoutExercise>(`/workouts/${sessionId}/exercises`, null, {
        params: { exercise_id: exerciseId }
      });
      return response.data;
    },
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutExerciseId, set }: { workoutExerciseId: string; set: Omit<WorkoutSet, 'id' | 'workout_exercise_id'> }) => {
      const response = await api.post<WorkoutSet>(`/workouts/exercises/${workoutExerciseId}/sets`, set);
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['workouts'] });
      const previousWorkouts = queryClient.getQueryData(['workouts']);
      return { previousWorkouts };
    },
    onError: (err, newSet, context) => {
      if (context?.previousWorkouts) {
        queryClient.setQueryData(['workouts'], context.previousWorkouts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post<WorkoutSession>(`/workouts/${sessionId}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
