import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { WorkoutSession, WorkoutSet, WorkoutExercise } from '../types/api';

export function useWorkouts(userId: number) {
  return useQuery<WorkoutSession[]>({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      const response = await api.get(`/workouts/user/${userId}/history`);
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, planId }: { userId: number; planId?: number }) => {
      const response = await api.post<WorkoutSession>('/workouts/start', null, {
        params: { user_id: userId, plan_id: planId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useAddExerciseToSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, exerciseId }: { sessionId: number; exerciseId: number }) => {
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
    mutationFn: async ({ workoutExerciseId, set }: { workoutExerciseId: number; set: Omit<WorkoutSet, 'id' | 'workout_exercise_id'> }) => {
      const response = await api.post<WorkoutSet>(`/workouts/exercises/${workoutExerciseId}/sets`, set);
      return response.data;
    },
    onMutate: async ({ workoutExerciseId, set }) => {
      await queryClient.cancelQueries({ queryKey: ['workouts'] });
      const previousWorkouts = queryClient.getQueryData(['workouts']);

      // Implementation of optimistic update would be here, but requires knowing the structure of 'workouts' response
      // which is usually a list of sessions.

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
    mutationFn: async (sessionId: number) => {
      const response = await api.post<WorkoutSession>(`/workouts/${sessionId}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
