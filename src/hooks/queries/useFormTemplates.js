import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const formTemplateKeys = {
  all: ['formTemplates'],
  lists: () => [...formTemplateKeys.all, 'list'],
  list: (filters) => [...formTemplateKeys.lists(), filters],
  details: () => [...formTemplateKeys.all, 'detail'],
  detail: (id) => [...formTemplateKeys.details(), id],
  submissions: (id) => [...formTemplateKeys.detail(id), 'submissions'],
};

// Fetch form templates
export function useFormTemplates({ page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: formTemplateKeys.list({ page, search }),
    queryFn: async () => {
      const response = await api.get('/api/form-templates', {
        params: { page, search: search || undefined }
      });
      return response.data;
    },
  });
}

// Fetch single form template
export function useFormTemplate(id) {
  return useQuery({
    queryKey: formTemplateKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/form-templates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch form submissions
export function useFormSubmissions(templateId, { page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: [...formTemplateKeys.submissions(templateId), { page, search }],
    queryFn: async () => {
      const response = await api.get(`/api/form-templates/${templateId}/submissions`, {
        params: { page, search: search || undefined }
      });
      return response.data;
    },
    enabled: !!templateId,
  });
}

// Create form template mutation
export function useCreateFormTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/form-templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.all });
    },
  });
}

// Update form template mutation
export function useUpdateFormTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/form-templates/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.detail(id) });
    },
  });
}

// Delete form template mutation
export function useDeleteFormTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/form-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.all });
    },
  });
}

// Submit form mutation
export function useSubmitForm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ templateId, data }) => {
      const response = await api.post(`/api/form-templates/${templateId}/submissions`, data);
      return response.data;
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.submissions(templateId) });
    },
  });
}

// Delete form submission mutation
export function useDeleteFormSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ templateId, submissionId }) => {
      await api.delete(`/api/form-templates/${templateId}/submissions/${submissionId}`);
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: formTemplateKeys.submissions(templateId) });
    },
  });
}

// Available models for form builder
export function useAvailableModels() {
  return useQuery({
    queryKey: ['availableModels'],
    queryFn: async () => {
      const response = await api.get('/api/form-templates/available-models');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - models don't change often
  });
}

// Model fields
export function useModelFields(model) {
  return useQuery({
    queryKey: ['modelFields', model],
    queryFn: async () => {
      const response = await api.get(`/api/form-templates/model-fields/${model}`);
      return response.data;
    },
    enabled: !!model,
    staleTime: 30 * 60 * 1000,
  });
}
