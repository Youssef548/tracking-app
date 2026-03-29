import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { MonthlyGoalItem, GoalItem } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useMonthlyGoals(monthKey: string): UseQueryResult<MonthlyGoalItem[]> {
  return useQuery({
    queryKey: ['monthly-goals', monthKey],
    queryFn: () =>
      api.get<MonthlyGoalItem[]>(`/monthly-goals/${monthKey}`).then((r) => r.data),
    enabled: !!monthKey,
  });
}

interface UpsertMonthlyGoalInput {
  monthKey: string;
  habitId: string;
  items: Omit<GoalItem, '_id'>[];
}

export function useUpsertMonthlyGoal(): UseMutationResult<MonthlyGoalItem, Error, UpsertMonthlyGoalInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ monthKey, habitId, items }: UpsertMonthlyGoalInput) =>
      api
        .put<MonthlyGoalItem>(`/monthly-goals/${monthKey}/${habitId}`, { items })
        .then((r) => r.data),
    onSuccess: (_, { monthKey }) =>
      qc.invalidateQueries({ queryKey: ['monthly-goals', monthKey] }),
  });
}
