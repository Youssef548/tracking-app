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
