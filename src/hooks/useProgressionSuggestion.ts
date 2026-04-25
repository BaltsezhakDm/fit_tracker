/**
 * useProgressionSuggestion.ts
 *
 * Hook для получения умных рекомендаций весов и повторений
 * на основе истории тренировок из Supabase.
 *
 * Алгоритм:
 * 1. Берём кеш прогрессии из Supabase (последняя тренировка)
 * 2. Вычисляем следующую цель через engine.calcNextTarget()
 * 3. Возвращаем готовые target_weight и target_reps
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import {
  calcOneRM,
  calcNextTarget,
  type DayType,
  type ProgressionSuggestion as EngineProgressionSuggestion,
} from '../lib/engine';

// -----------------------------------------------
// Получить кеш прогрессии для упражнения
// -----------------------------------------------
export function useProgressionSuggestion(
  userId: string | number | null,
  exerciseId: number | null,
  dayType: DayType = 'hypertrophy'
) {
  return useQuery({
    queryKey: ['progression-suggestion', userId, exerciseId, dayType],
    queryFn: async (): Promise<EngineProgressionSuggestion & { lastOneRM: number | null }> => {
      if (!userId || !exerciseId) {
        return {
          targetWeight: 20,
          targetReps: 10,
          basis: 'default' as const,
          dayType,
          lastOneRM: null,
          confidence: 'low' as const,
        };
      }

      // 1. Проверяем кеш прогрессии
      const { data: cached, error } = await supabase
        .from('progression_cache')
        .select('*')
        .eq('user_id', String(userId))
        .eq('exercise_ref_id', exerciseId)
        .single();

      if (!error && cached && cached.last_weight && cached.last_reps) {
        const suggestion = calcNextTarget(
          cached.last_weight,
          cached.last_reps,
          dayType,
          cached.last_rpe
        );
        return {
          ...suggestion,
          lastOneRM: cached.last_one_rm,
          confidence: 'high' as const,
        };
      }

      // 2. Если кеша нет — ищем в истории smart_sets напрямую
      const { data: recentSets } = await supabase
        .from('smart_sets')
        .select(`
          actual_weight,
          actual_reps,
          rpe,
          one_rm_calc,
          created_at,
          session_exercises!inner(exercise_ref_id, session_id,
            workout_sessions_smart!inner(user_id)
          )
        `)
        .eq('session_exercises.workout_sessions_smart.user_id', String(userId))
        .eq('session_exercises.exercise_ref_id', exerciseId)
        .eq('is_done', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentSets && recentSets.length > 0) {
        const last = recentSets[0];
        const w = last.actual_weight || 0;
        const r = last.actual_reps || 0;
        const suggestion = calcNextTarget(w, r, dayType, last.rpe);
        const oneRM = last.one_rm_calc || (w > 0 && r > 0 ? calcOneRM(w, r) : null);
        return {
          ...suggestion,
          lastOneRM: oneRM,
          confidence: 'medium' as const,
        };
      }

      // 3. Нет данных — дефолт
      return {
        targetWeight: 20,
        targetReps: 10,
        basis: 'default' as const,
        dayType,
        lastOneRM: null,
        confidence: 'low' as const,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 минут кеш
  });
}

// -----------------------------------------------
// Сохранить результат подхода в кеш прогрессии
// -----------------------------------------------
export function useUpdateProgressionCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      exerciseId,
      weight,
      reps,
      rpe,
    }: {
      userId: string | number;
      exerciseId: number;
      weight: number;
      reps: number;
      rpe?: number | null;
    }) => {
      const oneRM = calcOneRM(weight, reps);

      const { error } = await supabase
        .from('progression_cache')
        .upsert(
          {
            user_id: String(userId),
            exercise_ref_id: exerciseId,
            last_weight: weight,
            last_reps: reps,
            last_one_rm: oneRM,
            last_rpe: rpe || null,
            last_session_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,exercise_ref_id' }
        );

      if (error) throw error;
      return { oneRM };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['progression-suggestion', variables.userId, variables.exerciseId],
      });
    },
  });
}

// -----------------------------------------------
// Получить историю 1RM для графика прогресса
// -----------------------------------------------
export function useOneRMHistory(
  userId: string | number | null,
  exerciseId: number | null
) {
  return useQuery({
    queryKey: ['one-rm-history', userId, exerciseId],
    queryFn: async () => {
      if (!userId || !exerciseId) return [];

      const { data, error } = await supabase
        .from('smart_sets')
        .select(`
          actual_weight,
          actual_reps,
          one_rm_calc,
          created_at,
          session_exercises!inner(
            exercise_ref_id,
            workout_sessions_smart!inner(user_id, start_time)
          )
        `)
        .eq('session_exercises.workout_sessions_smart.user_id', String(userId))
        .eq('session_exercises.exercise_ref_id', exerciseId)
        .eq('is_done', true)
        .not('actual_weight', 'is', null)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error || !data) return [];

      // Группируем по сессиям, берём макс 1RM за сессию
      const bySession: Record<string, { date: string; maxOneRM: number; maxWeight: number }> = {};

      for (const s of data) {
        const se = (s as any).session_exercises;
        const ws = se?.workout_sessions_smart;
        const sessionDate = ws?.start_time || s.created_at;
        const sessionKey = sessionDate.split('T')[0];

        const w = s.actual_weight || 0;
        const r = s.actual_reps || 0;
        const oneRM = s.one_rm_calc || (w > 0 && r > 0 ? calcOneRM(w, r) : 0);

        if (!bySession[sessionKey] || oneRM > bySession[sessionKey].maxOneRM) {
          bySession[sessionKey] = {
            date: sessionKey,
            maxOneRM: Math.round(oneRM * 10) / 10,
            maxWeight: w,
          };
        }
      }

      return Object.values(bySession).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    enabled: !!userId && !!exerciseId,
    staleTime: 1000 * 60 * 10,
  });
}
