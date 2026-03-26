import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then((r) => r.data),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/habits', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/habits/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/habits/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}
