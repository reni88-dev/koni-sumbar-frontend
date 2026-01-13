import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const formBuilderKeys = {
  all: ['formBuilder'],
  templates: () => [...formBuilderKeys.all, 'templates'],
  templateList: (filters) => [...formBuilderKeys.templates(), filters],
  template: (id) => [...formBuilderKeys.templates(), id],
  submissions: (templateId) => [...formBuilderKeys.all, 'submissions', templateId],
  submissionList: (templateId, filters) => [...formBuilderKeys.submissions(templateId), filters],
  models: () => [...formBuilderKeys.all, 'models'],
  modelFields: (model) => [...formBuilderKeys.all, 'modelFields', model],
};

// Fetch form templates (paginated)
export function useFormBuilderTemplates({ search = '', perPage = 20 } = {}) {
  return useQuery({
    queryKey: formBuilderKeys.templateList({ search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/form-builder/templates', {
        params: { search: search || undefined, per_page: perPage }
      });
      return response.data;
    },
  });
}

// Fetch all active form templates (for dropdowns/lists)
export function useFormBuilderTemplatesAll() {
  return useQuery({
    queryKey: [...formBuilderKeys.templates(), 'all'],
    queryFn: async () => {
      const response = await api.get('/api/form-builder/templates', {
        params: { per_page: 100 } // Get all templates
      });
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single form template
export function useFormBuilderTemplate(id) {
  return useQuery({
    queryKey: formBuilderKeys.template(id),
    queryFn: async () => {
      const response = await api.get(`/api/form-builder/templates/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create form template
export function useCreateFormBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/form-builder/templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formBuilderKeys.templates() });
    },
  });
}

// Update form template
export function useUpdateFormBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/form-builder/templates/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: formBuilderKeys.templates() });
      queryClient.invalidateQueries({ queryKey: formBuilderKeys.template(id) });
    },
  });
}

// Delete form template
export function useDeleteFormBuilderTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/form-builder/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formBuilderKeys.templates() });
    },
  });
}

// Fetch form submissions
export function useFormBuilderSubmissions(templateId, { search = '', eventId = '', perPage = 20 } = {}) {
  return useQuery({
    queryKey: formBuilderKeys.submissionList(templateId, { search, eventId, perPage }),
    queryFn: async () => {
      const response = await api.get(`/api/form-builder/templates/${templateId}/submissions`, {
        params: { 
          search: search || undefined, 
          event_id: eventId || undefined,
          per_page: perPage 
        }
      });
      return response.data;
    },
    enabled: !!templateId,
  });
}

// Delete form submission
export function useDeleteFormBuilderSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId) => {
      await api.delete(`/api/form-builder/submissions/${submissionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formBuilderKeys.all });
    },
  });
}

// Submit form
export function useSubmitFormBuilder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, data }) => {
      const response = await api.post(`/api/form-builder/templates/${templateId}/submissions`, data);
      return response.data;
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: formBuilderKeys.submissions(templateId) });
    },
  });
}

// Available models for form builder
export function useFormBuilderModels() {
  return useQuery({
    queryKey: formBuilderKeys.models(),
    queryFn: async () => {
      const response = await api.get('/api/form-builder/models');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Model fields
export function useFormBuilderModelFields(model) {
  return useQuery({
    queryKey: formBuilderKeys.modelFields(model),
    queryFn: async () => {
      const response = await api.get(`/api/form-builder/models/${model}/fields`);
      return response.data;
    },
    enabled: !!model,
    staleTime: 30 * 60 * 1000,
  });
}
