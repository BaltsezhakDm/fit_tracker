import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { AnalyticsSummary, WorkloadData, PersonalRecord, ProgressionData, MuscleWorkload } from '../types/api';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsSummary>('/analytics/summary');
      return data;
    },
  });
}

export function useWorkload(period: string = 'week') {
  return useQuery({
    queryKey: ['analytics', 'workload', period],
    queryFn: async () => {
      const { data } = await api.get<WorkloadData[]>(`/analytics/workload?period=${period}`);
      return data;
    },
  });
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: ['analytics', 'records'],
    queryFn: async () => {
      const { data } = await api.get<PersonalRecord[]>('/analytics/records');
      return data;
    },
  });
}

export function useExerciseProgression(exerciseId: number) {
  return useQuery({
    queryKey: ['analytics', 'progression', exerciseId],
    queryFn: async () => {
      const { data } = await api.get<ProgressionData[]>(`/analytics/progression/${exerciseId}`);
      return data;
    },
  });
}

export function useMuscleDistribution(period: string = 'week') {
  return useQuery({
    queryKey: ['analytics', 'muscle-distribution', period],
    queryFn: async () => {
      const { data } = await api.get<MuscleWorkload[]>(`/analytics/muscle-distribution?period=${period}`);
      return data;
    },
  });
}
