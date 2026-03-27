import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { Completion, CreateCompletionInput } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useCompletionsByDate(date: string): UseQueryResult<Completion[]> {
  return useQuery({
    queryKey: ['completions', date],
    queryFn: () => api.get<Completion[]>('/completions', { params: { date } }).then((r) => r.data),
    enabled: !!date,
  });
}

export function useCompletionsByRange(from: string, to: string): UseQueryResult<Completion[]> {
  return useQuery({
    queryKey: ['completions', from, to],
    queryFn: () =>
      api.get<Completion[]>('/completions', { params: { from, to } }).then((r) => r.data),
    enabled: !!from && !!to,
  });
}

export function useCreateCompletion(): UseMutationResult<Completion, Error, CreateCompletionInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCompletionInput) =>
      api.post<Completion>('/completions', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export function useDeleteCompletion(): UseMutationResult<unknown, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/completions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['completions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
