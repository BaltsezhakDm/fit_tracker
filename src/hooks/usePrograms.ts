import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { TrainingProgram, TrainingPlanRead, TrainingPlanCreate, PlanExerciseCreate, PlanExerciseRead } from '../types/api';

export function usePrograms() {
  return useQuery<TrainingProgram[]>({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      return (data || []).map(t => ({
        id: t.id,
        user_id: 1, // Mocked
        name: t.name,
        description: t.description,
      })) as TrainingProgram[];
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (programId: number) => {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', programId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useGetPlanExercises(planId: number | null) {
  return useQuery<PlanExerciseRead[]>({
    queryKey: ['plans', planId, 'exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', planId)
        .order('order_index');
      
      if (error) throw error;
      return (data || []).map(ex => ({
        plan_id: ex.template_id,
        exercise_id: ex.exercise_ref_id,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps_max,
      })) as PlanExerciseRead[];
    },
    enabled: !!planId,
  });
}

export function useGetProgramPlans(programId: number | null) {
  return useQuery<TrainingPlanRead[]>({
    queryKey: ['programs', programId, 'plans'],
    queryFn: async () => {
      // In the new schema, a template is basically a plan. 
      // We'll return the template itself as a plan for compatibility.
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('id', programId)
        .single();
      
      if (error) throw error;
      return [{
        id: data.id,
        program_id: data.id,
        name: data.name,
        day_of_week: null,
      }] as TrainingPlanRead[];
    },
    enabled: !!programId,
  });
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: async (plan: TrainingPlanCreate) => {
      // In our current simple schema, a "plan" is just a part of a template.
      // But for now, we'll just return the program_id as the plan_id
      // to maintain compatibility with the UI.
      return { id: plan.program_id, ...plan, day_of_week: null } as TrainingPlanRead;
    },
  });
}

export function useAddExerciseToPlan() {
  return useMutation({
    mutationFn: async ({ planId, exercise }: { planId: number; exercise: PlanExerciseCreate }) => {
      const { data: exData } = await supabase
        .from('exercises_smart')
        .select('name')
        .eq('id', exercise.exercise_id)
        .single();

      const { data, error } = await supabase
        .from('template_exercises')
        .insert({
          template_id: planId,
          exercise_ref_id: exercise.exercise_id,
          exercise_name: exData?.name || 'Unknown',
          target_sets: exercise.target_sets,
          target_reps_min: exercise.target_reps - 2, // Heuristic
          target_reps_max: exercise.target_reps,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, program }: { userId: string | number; program: Omit<TrainingProgram, 'id' | 'user_id'> }) => {
      const { data, error } = await supabase
        .from('workout_templates')
        .insert({
          name: program.name,
          description: program.description,
          user_id: String(userId),
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return {
        id: data.id,
        user_id: Number(userId),
        name: data.name,
        description: data.description,
      } as TrainingProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, program }: { id: number; program: Partial<TrainingProgram> }) => {
      const { data, error } = await supabase
        .from('workout_templates')
        .update({
          name: program.name,
          description: program.description,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return {
        id: data.id,
        user_id: 1,
        name: data.name,
        description: data.description,
      } as TrainingProgram;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useDeletePlanExercises() {
  return useMutation({
    mutationFn: async (planId: number) => {
      const { error } = await supabase
        .from('template_exercises')
        .delete()
        .eq('template_id', planId);
      if (error) throw error;
    },
  });
}

