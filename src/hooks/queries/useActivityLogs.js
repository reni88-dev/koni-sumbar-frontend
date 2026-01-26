import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

/**
 * Query keys for activity logs
 */
export const activityLogKeys = {
  all: ['activityLogs'],
  lists: () => [...activityLogKeys.all, 'list'],
  list: (filters) => [...activityLogKeys.lists(), filters],
  stats: () => [...activityLogKeys.all, 'stats'],
  users: () => [...activityLogKeys.all, 'users'],
  detail: (id) => [...activityLogKeys.all, 'detail', id],
};

/**
 * Hook to fetch activity logs with pagination and filters
 */
export const useActivityLogs = (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.per_page) params.append('per_page', filters.per_page);
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.model) params.append('model', filters.model);
  if (filters.action) params.append('action', filters.action);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);

  return useQuery({
    queryKey: activityLogKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get(`/api/activity-logs?${params.toString()}`);
      return data;
    },
  });
};

/**
 * Hook to fetch activity log statistics
 */
export const useActivityLogStats = () => {
  return useQuery({
    queryKey: activityLogKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/api/activity-logs/stats');
      return data;
    },
  });
};

/**
 * Hook to fetch users for filter dropdown
 */
export const useActivityLogUsers = () => {
  return useQuery({
    queryKey: activityLogKeys.users(),
    queryFn: async () => {
      const { data } = await api.get('/api/activity-logs/users');
      return data;
    },
  });
};

/**
 * Hook to fetch single activity log detail
 */
export const useActivityLogDetail = (id) => {
  return useQuery({
    queryKey: activityLogKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/api/activity-logs/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to cleanup old activity logs
 */
export const useCleanupActivityLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (days = 90) => {
      const { data } = await api.delete(`/api/activity-logs/cleanup?days=${days}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityLogKeys.all });
    },
  });
};

/**
 * Helper function to export logs (triggers download)
 */
export const exportActivityLogs = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.user_id) params.append('user_id', filters.user_id);
  if (filters.model) params.append('model', filters.model);
  if (filters.action) params.append('action', filters.action);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const response = await api.get(`/api/activity-logs/export?${params.toString()}`, {
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ==========================================
// ERROR LOG HOOKS
// ==========================================

/**
 * Query keys for error logs
 */
export const errorLogKeys = {
  all: ['errorLogs'],
  lists: () => [...errorLogKeys.all, 'list'],
  list: (filters) => [...errorLogKeys.lists(), filters],
  stats: () => [...errorLogKeys.all, 'stats'],
  detail: (id) => [...errorLogKeys.all, 'detail', id],
};

/**
 * Hook to fetch error logs with pagination and filters
 */
export const useErrorLogs = (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page);
  if (filters.per_page) params.append('per_page', filters.per_page);
  if (filters.type) params.append('type', filters.type);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.is_resolved !== undefined) params.append('is_resolved', filters.is_resolved);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);

  return useQuery({
    queryKey: errorLogKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get(`/api/error-logs?${params.toString()}`);
      return data;
    },
  });
};

/**
 * Hook to fetch error log statistics
 */
export const useErrorLogStats = () => {
  return useQuery({
    queryKey: errorLogKeys.stats(),
    queryFn: async () => {
      const { data } = await api.get('/api/error-logs/stats');
      return data;
    },
  });
};

/**
 * Hook to resolve an error
 */
export const useResolveError = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }) => {
      const { data } = await api.post(`/api/error-logs/${id}/resolve`, { notes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: errorLogKeys.all });
    },
  });
};
