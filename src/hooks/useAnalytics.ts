/**
 * useAnalytics.ts — расширенный модуль аналитики
 *
 * Содержит:
 * - Старые хуки (совместимость с FastAPI)
 * - Новые хуки на основе Supabase + engine.ts:
 *   - useMuscleLoadPercent: нагрузка на мышцы в % от MRV за 7/14 дней
 *   - useDeloadTrigger: анализ необходимости разгрузки
 *   - useSmartStats: расширенная сводка
 */

import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { supabase } from '../lib/supabaseClient';
import {
  AnalyticsSummary,
  WorkloadData,
  PersonalRecord,
  ProgressionData,
  MuscleWorkload,
} from '../types/api';
import {
  calcOneRM,
  aggregateMuscleLoad,
  analyzeDeloadNeed,
  type MuscleLoadResult,
  type DeloadAnalysis,
  type ExerciseSetsWithWeights,
} from '../lib/engine';

// -----------------------------------------------
// Старые хуки (FastAPI) — совместимость
// -----------------------------------------------

// -----------------------------------------------
// Старые хуки (FastAPI) — совместимость через Supabase
// -----------------------------------------------

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async (): Promise<AnalyticsSummary> => {
      const { data: sessions } = await supabase
        .from('workout_sessions_smart')
        .select('total_volume, id')
        .not('end_time', 'is', null);

      const totalVolume = sessions?.reduce((acc, s) => acc + (s.total_volume || 0), 0) || 0;
      const workoutsCount = sessions?.length || 0;

      // Mock other fields for now
      return {
        total_volume: totalVolume,
        workouts_count: workoutsCount,
        last_week_volume_change_percent: 0,
        records_count: 0,
      };
    },
  });
}

export function useWorkload(period: string = 'week') {
  return useQuery({
    queryKey: ['analytics', 'workload', period],
    queryFn: async (): Promise<WorkloadData[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (period === 'week' ? 7 : 30));

      const { data } = await supabase
        .from('workout_sessions_smart')
        .select('start_time, total_volume')
        .gte('start_time', since.toISOString())
        .order('start_time', { ascending: true });

      const workloadMap: Record<string, number> = {};
      data?.forEach(s => {
        const date = s.start_time.split('T')[0];
        workloadMap[date] = (workloadMap[date] || 0) + (s.total_volume || 0);
      });

      return Object.entries(workloadMap).map(([date, volume]) => ({ date, volume }));
    },
  });
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: ['analytics', 'records'],
    queryFn: async (): Promise<PersonalRecord[]> => {
      // In a real app, we'd query the progression_cache or smart_sets
      const { data } = await supabase
        .from('progression_cache')
        .select('*, exercises_smart(name)');
      
      return (data || []).map(r => ({
        exercise_id: r.exercise_ref_id,
        exercise_name: (r as any).exercises_smart?.name || 'Unknown',
        weight: r.last_weight || 0,
        date: r.last_session_date || r.updated_at,
      }));
    },
  });
}

export function useExerciseProgression(userId: string | number, exerciseId: number) {
  return useQuery({
    queryKey: ['analytics', 'progression', exerciseId],
    queryFn: async (): Promise<ProgressionData[]> => {
      const { data } = await supabase
        .from('smart_sets')
        .select('actual_weight, created_at, session_exercises!inner(exercise_ref_id, workout_sessions_smart!inner(total_volume))')
        .eq('session_exercises.exercise_ref_id', exerciseId)
        .eq('is_done', true)
        .order('created_at', { ascending: true });

      return (data || []).map(s => ({
        date: s.created_at,
        max_weight: s.actual_weight || 0,
        total_volume: (s as any).session_exercises?.workout_sessions_smart?.total_volume || 0,
      }));
    },
    enabled: !!exerciseId && !!userId,
  });
}

export function useMuscleDistribution(period: string = 'week') {
  return useQuery({
    queryKey: ['analytics', 'muscle-distribution', period],
    queryFn: async (): Promise<MuscleWorkload[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (period === 'week' ? 7 : 30));

      const { data } = await supabase
        .from('smart_sets')
        .select('actual_weight, session_exercises!inner(muscle_weights, workout_sessions_smart!inner(start_time))')
        .eq('is_done', true)
        .gte('session_exercises.workout_sessions_smart.start_time', since.toISOString());

      const muscleMap: Record<string, { volume: number; sets: number }> = {};
      data?.forEach(s => {
        const se = (s as any).session_exercises;
        const weights = se.muscle_weights || {};
        const volume = s.actual_weight || 0;

        Object.entries(weights).forEach(([muscle, weight]) => {
          if (!muscleMap[muscle]) muscleMap[muscle] = { volume: 0, sets: 0 };
          muscleMap[muscle].volume += volume * (weight as number);
          muscleMap[muscle].sets += 1 * (weight as number);
        });
      });

      return Object.entries(muscleMap).map(([muscle, stats]) => ({
        muscle,
        volume: stats.volume,
        sets_count: Math.round(stats.sets),
      }));
    },
  });
}

// -----------------------------------------------
// Новые хуки (Supabase + engine.ts)
// -----------------------------------------------

/**
 * useMuscleLoadPercent — нагрузка на мышцы в % от MRV
 * за последние 7 или 14 дней
 */
export function useMuscleLoadPercent(
  userId: string | number | null,
  days: 7 | 14 = 7
) {
  return useQuery({
    queryKey: ['smart-analytics', 'muscle-load', userId, days],
    queryFn: async (): Promise<Record<string, MuscleLoadResult>> => {
      if (!userId) return {};

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Получаем все выполненные сеты за период со снапшотом muscle_weights
      const { data, error } = await supabase
        .from('smart_sets')
        .select(`
          id,
          is_done,
          session_exercises!inner(
            exercise_ref_id,
            exercise_name,
            muscle_weights,
            workout_sessions_smart!inner(
              user_id,
              start_time
            )
          )
        `)
        .eq('is_done', true)
        .eq('session_exercises.workout_sessions_smart.user_id', String(userId))
        .gte('session_exercises.workout_sessions_smart.start_time', since.toISOString());

      if (error || !data || data.length === 0) return {};

      // Группируем по упражнениям
      const exerciseMap: Record<number, ExerciseSetsWithWeights> = {};

      for (const set of data) {
        const se = (set as any).session_exercises;
        if (!se) continue;
        const exId = se.exercise_ref_id || 0;
        const muscleWeights = se.muscle_weights || {};

        if (!exerciseMap[exId]) {
          exerciseMap[exId] = {
            exerciseName: se.exercise_name || '',
            exerciseId: exId,
            muscleWeights,
            doneSetsCount: 0,
          };
        }
        exerciseMap[exId].doneSetsCount++;
      }

      return aggregateMuscleLoad(Object.values(exerciseMap));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * useDeloadTrigger — анализирует последние 14 дней
 * и возвращает рекомендацию Deload
 */
export function useDeloadTrigger(userId: string | number | null) {
  return useQuery({
    queryKey: ['smart-analytics', 'deload', userId],
    queryFn: async (): Promise<DeloadAnalysis> => {
      if (!userId) {
        return { shouldDeload: false, reason: null, avgRPE: null, oneRMDelta: null };
      }

      const since = new Date();
      since.setDate(since.getDate() - 14);

      const { data, error } = await supabase
        .from('smart_sets')
        .select(`
          rpe,
          one_rm_calc,
          actual_weight,
          actual_reps,
          created_at,
          session_exercises!inner(
            workout_sessions_smart!inner(user_id, start_time)
          )
        `)
        .eq('is_done', true)
        .eq('session_exercises.workout_sessions_smart.user_id', String(userId))
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return { shouldDeload: false, reason: null, avgRPE: null, oneRMDelta: null };
      }

      const setsForAnalysis = data.map(s => ({
        rpe: s.rpe,
        oneRM: s.one_rm_calc || (s.actual_weight && s.actual_reps
          ? calcOneRM(s.actual_weight, s.actual_reps)
          : null),
        date: s.created_at,
      }));

      return analyzeDeloadNeed(setsForAnalysis);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 15, // 15 минут
  });
}

/**
 * useSmartWorkoutStats — сводка умной статистики
 */
export function useSmartWorkoutStats(userId: string | number | null) {
  return useQuery({
    queryKey: ['smart-analytics', 'stats', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data: sessions } = await supabase
        .from('workout_sessions_smart')
        .select('id, start_time, total_volume, is_deload, day_type')
        .eq('user_id', String(userId))
        .order('start_time', { ascending: false })
        .limit(30);

      if (!sessions || sessions.length === 0) return null;

      const totalVolume = sessions.reduce((sum, s) => sum + (s.total_volume || 0), 0);
      const workoutCount = sessions.length;

      // Частота по типу дня
      const dayTypeCounts = sessions.reduce(
        (acc, s) => {
          const dt = s.day_type || 'hypertrophy';
          acc[dt] = (acc[dt] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalVolume,
        workoutCount,
        dayTypeCounts,
        lastWorkoutDate: sessions[0]?.start_time || null,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * useSmartMuscleHistory — история нагрузки на мышцы по дням (для графика)
 */
export function useSmartMuscleHistory(
  userId: string | number | null,
  muscle: string,
  days: number = 14
) {
  return useQuery({
    queryKey: ['smart-analytics', 'muscle-history', userId, muscle, days],
    queryFn: async () => {
      if (!userId || !muscle) return [];

      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data } = await supabase
        .from('smart_sets')
        .select(`
          created_at,
          session_exercises!inner(
            muscle_weights,
            workout_sessions_smart!inner(user_id, start_time)
          )
        `)
        .eq('is_done', true)
        .eq('session_exercises.workout_sessions_smart.user_id', String(userId))
        .gte('created_at', since.toISOString());

      if (!data) return [];

      // Группируем по дням
      const byDay: Record<string, number> = {};
      for (const set of data) {
        const se = (set as any).session_exercises;
        const muscleWeights = se?.muscle_weights || {};
        const coeff = muscleWeights[muscle] || 0;
        if (coeff === 0) continue;

        const day = new Date(set.created_at).toISOString().split('T')[0];
        byDay[day] = (byDay[day] || 0) + coeff;
      }

      return Object.entries(byDay)
        .map(([date, effectiveSets]) => ({ date, effectiveSets }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!userId && !!muscle,
    staleTime: 1000 * 60 * 5,
  });
}
