import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export function useWeeklyConsistency(weekStart) {
  return useQuery({
    queryKey: ['weekly-consistency', weekStart],
    queryFn: () => api.get('/analytics/weekly-consistency', { params: { week: weekStart } }).then((r) => r.data),
    enabled: !!weekStart,
  });
}
