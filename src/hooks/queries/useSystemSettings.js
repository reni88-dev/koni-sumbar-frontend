import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const systemSettingsKeys = {
  all: ['system-settings'],
};

// Global, super_admin-managed settings. Readable by every authenticated user.
export function useSystemSettings(options = {}) {
  return useQuery({
    queryKey: systemSettingsKeys.all,
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/settings/system');
      return response.data;
    },
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.put('/api/settings/system', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemSettingsKeys.all });
    },
  });
}
