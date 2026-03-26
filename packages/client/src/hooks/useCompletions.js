import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useCompletionsByDate(date) {
  return useQuery({
    queryKey: ['completions', date],
    queryFn: () => api.get('/completions', { params: { date } }).then((r) => r.data),
    enabled: !!date,
  });
}

export function useCompletionsByRange(from, to) {
  return useQuery({
    queryKey: ['completions', from, to],
    queryFn: () => api.get('/completions', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  });
}

export function useCreateCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/completions', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/completions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
