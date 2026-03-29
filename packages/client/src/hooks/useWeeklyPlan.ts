import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { WeeklyPlan, WeeklyPlanHabitOverride } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useWeeklyPlan(weekKey: string): UseQueryResult<WeeklyPlan | null> {
  return useQuery({
    queryKey: ['weekly-plan', weekKey],
    queryFn: async () => {
      try {
        const r = await api.get<WeeklyPlan>(`/weekly-plans/${weekKey}`);
        return r.data;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!weekKey,
  });
}

interface UpsertWeeklyPlanInput {
  weekKey: string;
  habitTargetOverrides: WeeklyPlanHabitOverride[];
  weekNote: string;
}

export function useUpsertWeeklyPlan(): UseMutationResult<WeeklyPlan, Error, UpsertWeeklyPlanInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weekKey, ...data }: UpsertWeeklyPlanInput) =>
      api.put<WeeklyPlan>(`/weekly-plans/${weekKey}`, data).then((r) => r.data),
    onSuccess: (_, { weekKey }) => qc.invalidateQueries({ queryKey: ['weekly-plan', weekKey] }),
  });
}
