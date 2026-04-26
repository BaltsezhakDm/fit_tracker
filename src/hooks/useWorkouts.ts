import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { WorkoutSession, WorkoutSet, WorkoutExercise, DayType } from '../types/api';

export function useWorkouts() {
  return useQuery<WorkoutSession[]>({
    queryKey: ['workouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sessions_smart')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(s => ({
        ...s,
        status: s.end_time ? 'completed' : 'active',
      })) as WorkoutSession[];
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('workout_sessions_smart')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('session_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index');
      
      if (error) throw error;
      return (data || []).map(ex => ({
        ...ex,
        exercise_id: ex.exercise_ref_id,
        order: ex.order_index,
      })) as WorkoutExercise[];
    },
    enabled: !!sessionId,
  });
}

export function useWorkoutSets(workoutExerciseId: string) {
  return useQuery<WorkoutSet[]>({
    queryKey: ['workout-exercises', workoutExerciseId, 'sets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('smart_sets')
        .select('*')
        .eq('session_exercise_id', workoutExerciseId)
        .order('set_index');
      
      if (error) throw error;
      return (data || []).map(s => ({
        ...s,
        reps: s.actual_reps || s.target_reps,
        weight: s.actual_weight || s.target_weight,
      })) as WorkoutSet[];
    },
    enabled: !!workoutExerciseId,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, planId }: { userId: string | number; planId?: number }) => {
      console.log('Starting workout for user:', userId, 'plan:', planId);
      const { data, error } = await supabase
        .from('workout_sessions_smart')
        .insert({
          user_id: String(userId),
          template_id: planId || null,
          day_type: 'hypertrophy' as DayType,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error in useStartWorkout:', error);
        throw error;
      }
      return {
        ...data,
        status: 'active',
      } as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useAddExerciseToSession() {
  return useMutation({
    mutationFn: async ({ sessionId, exerciseId }: { sessionId: string; exerciseId: number }) => {
      const { data: exData } = await supabase
        .from('exercises_smart')
        .select('name, muscle_weights')
        .eq('id', exerciseId)
        .single();

      const { data, error } = await supabase
        .from('session_exercises')
        .insert({
          session_id: sessionId,
          exercise_ref_id: exerciseId,
          exercise_name: exData?.name || 'Unknown',
          muscle_weights: exData?.muscle_weights || {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        exercise_id: data.exercise_ref_id,
        order: data.order_index,
      } as WorkoutExercise;
    },
  });
}

export function useAddSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutExerciseId, set }: { workoutExerciseId: string; set: Omit<WorkoutSet, 'id' | 'workout_exercise_id'> }) => {
      const { data, error } = await supabase
        .from('smart_sets')
        .insert({
          session_exercise_id: workoutExerciseId,
          actual_weight: set.weight,
          actual_reps: set.reps,
          target_weight: set.weight,
          target_reps: set.reps,
          rpe: set.rpe,
          is_warmup: set.is_warmup,
          is_done: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkoutSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await supabase
        .from('workout_sessions_smart')
        .update({
          end_time: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        status: 'completed',
      } as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
