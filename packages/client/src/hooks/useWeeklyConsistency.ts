import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import api from '../services/api';

export interface WeeklyDayCell {
  completed: boolean;
  isFuture: boolean;
  value: number;
}

export interface WeeklyHabit {
  habitId: string;
  name: string;
  trackingType: string;
  weeklyTarget: number | null;
  totalHours: number;
  rate: number;
  days: Record<string, WeeklyDayCell>;
  category: { name: string; color: string } | null;
}

export interface WeeklyConsistency {
  overallScore: number;
  dailyScores: Record<string, number | null>;
  habits: WeeklyHabit[];
}

export function useWeeklyConsistency(weekStart?: string): UseQueryResult<WeeklyConsistency> {
  return useQuery({
    queryKey: ['weekly-consistency', weekStart],
    queryFn: () =>
      api
        .get<WeeklyConsistency>('/analytics/weekly-consistency', { params: { week: weekStart } })
        .then((r) => r.data),
    enabled: !!weekStart,
  });
}
