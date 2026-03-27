import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { Category, CreateCategoryInput } from '@mindful-flow/shared/types';
import api from '../services/api';

export function useCategories(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories').then((r) => r.data),
  });
}

export function useCreateCategory(): UseMutationResult<Category, Error, CreateCategoryInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      api.post<Category>('/categories', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export function useUpdateCategory(): UseMutationResult<Category, Error, UpdateCategoryInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCategoryInput) =>
      api.put<Category>(`/categories/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory(): UseMutationResult<unknown, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
