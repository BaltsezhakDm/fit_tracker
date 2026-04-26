import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Exercise } from '../types/api';

export function useExercises() {
  return useQuery<Exercise[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises_smart')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []) as Exercise[];
    },
    staleTime: Infinity,
  });
}

export function useExercise(id: number | null) {
  return useQuery<Exercise>({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises_smart')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Exercise;
    },
    enabled: !!id,
  });
}
