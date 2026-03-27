import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import api from '../services/api';

export interface DayData {
  date: string;
  count: number;
}

export interface DayCompletion {
  date: string;
  completions: unknown[];
}

export interface WeeklyAnalytics {
  score: number;
  completedCount: number;
  targetCount: number;
  streak: number;
  bestDay: string | null;
  dayData: DayData[];
}

export interface MonthlyAnalytics {
  days: DayCompletion[];
}

export function useWeeklyAnalytics(): UseQueryResult<WeeklyAnalytics> {
  return useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => api.get<WeeklyAnalytics>('/analytics/weekly').then((r) => r.data),
  });
}

export function useMonthlyAnalytics(
  month: number,
  year: number
): UseQueryResult<MonthlyAnalytics> {
  return useQuery({
    queryKey: ['analytics', 'monthly', month, year],
    queryFn: () =>
      api
        .get<MonthlyAnalytics>('/analytics/monthly', { params: { month, year } })
        .then((r) => r.data),
    enabled: !!month && !!year,
  });
}

export interface HabitAnalytics {
  habitId: string;
  rate: number;
  [key: string]: unknown;
}

export function useHabitAnalytics(habitId: string): UseQueryResult<HabitAnalytics> {
  return useQuery({
    queryKey: ['analytics', 'habit', habitId],
    queryFn: () =>
      api.get<HabitAnalytics>(`/analytics/habits/${habitId}`).then((r) => r.data),
    enabled: !!habitId,
  });
}

export function useLast30DaysAnalytics(): UseQueryResult<MonthlyAnalytics> {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);

  const fromStr = from.toISOString().split('T')[0] ?? '';
  const toStr = to.toISOString().split('T')[0] ?? '';

  return useQuery({
    queryKey: ['analytics', 'last30', fromStr, toStr],
    queryFn: () =>
      api
        .get<MonthlyAnalytics>('/analytics/monthly', { params: { from: fromStr, to: toStr } })
        .then((r) => r.data),
  });
}
