import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { WeeklyReview, TotalsEntry } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useWeeklyReview(weekKey: string): UseQueryResult<WeeklyReview | null> {
  return useQuery({
    queryKey: ['weekly-review', weekKey],
    queryFn: async () => {
      try {
        const r = await api.get<WeeklyReview>(`/weekly-reviews/${weekKey}`);
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

interface UpsertWeeklyReviewInput {
  weekKey: string;
  wentWell: string;
  toImprove: string;
  changesNextWeek: string;
  totals: TotalsEntry[];
}

export function useUpsertWeeklyReview(): UseMutationResult<WeeklyReview, Error, UpsertWeeklyReviewInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ weekKey, ...data }: UpsertWeeklyReviewInput) =>
      api.put<WeeklyReview>(`/weekly-reviews/${weekKey}`, data).then((r) => r.data),
    onSuccess: (_, { weekKey }) =>
      qc.invalidateQueries({ queryKey: ['weekly-review', weekKey] }),
  });
}
