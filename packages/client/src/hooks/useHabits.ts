import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { Habit, CreateHabitInput } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useHabits(): UseQueryResult<Habit[]> {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get<Habit[]>('/habits').then((r) => r.data),
  });
}

export function useCreateHabit(): UseMutationResult<Habit, Error, CreateHabitInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHabitInput) => api.post<Habit>('/habits', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

interface UpdateHabitInput extends Partial<CreateHabitInput> {
  id: string;
}

export function useUpdateHabit(): UseMutationResult<Habit, Error, UpdateHabitInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateHabitInput) =>
      api.put<Habit>(`/habits/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}

export function useDeleteHabit(): UseMutationResult<unknown, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/habits/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
}
