import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useWeeklyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => api.get('/analytics/weekly').then((r) => r.data),
  });
}

export function useMonthlyAnalytics(month, year) {
  return useQuery({
    queryKey: ['analytics', 'monthly', month, year],
    queryFn: () => api.get('/analytics/monthly', { params: { month, year } }).then((r) => r.data),
    enabled: !!month && !!year,
  });
}

export function useHabitAnalytics(habitId) {
  return useQuery({
    queryKey: ['analytics', 'habit', habitId],
    queryFn: () => api.get(`/analytics/habits/${habitId}`).then((r) => r.data),
    enabled: !!habitId,
  });
}

export function useLast30DaysAnalytics() {
  const to = new Date();
  to.setUTCHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);

  const fromStr = from.toISOString().split('T')[0];
  const toStr = to.toISOString().split('T')[0];

  return useQuery({
    queryKey: ['analytics', 'last30', fromStr, toStr],
    queryFn: () =>
      api.get('/analytics/monthly', { params: { from: fromStr, to: toStr } }).then((r) => r.data),
  });
}
