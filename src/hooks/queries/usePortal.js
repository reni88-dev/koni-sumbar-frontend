import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const portalKeys = {
  all: ['portal'],
  profile: () => [...portalKeys.all, 'profile'],
  events: () => [...portalKeys.all, 'events'],
  submissions: () => [...portalKeys.all, 'submissions'],
  dashboard: () => [...portalKeys.all, 'dashboard'],
  athletes: () => [...portalKeys.all, 'athletes'],
};

// Fetch user's portal profile
export function usePortalProfile() {
  return useQuery({
    queryKey: portalKeys.profile(),
    queryFn: async () => {
      const response = await api.get('/api/portal/profile');
      return response.data;
    },
  });
}

// Update portal profile
export function useUpdatePortalProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/api/portal/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalKeys.profile() });
    },
  });
}

// Fetch user's events
export function usePortalEvents() {
  return useQuery({
    queryKey: portalKeys.events(),
    queryFn: async () => {
      const response = await api.get('/api/portal/events');
      return response.data;
    },
  });
}

// Fetch user's form submissions
export function usePortalSubmissions() {
  return useQuery({
    queryKey: portalKeys.submissions(),
    queryFn: async () => {
      const response = await api.get('/api/portal/submissions');
      return response.data;
    },
  });
}

// Fetch dashboard stats
export function usePortalDashboard() {
  return useQuery({
    queryKey: portalKeys.dashboard(),
    queryFn: async () => {
      const response = await api.get('/api/portal/dashboard');
      return response.data;
    },
  });
}

// Fetch coach's athletes (coach only)
export function usePortalAthletes() {
  return useQuery({
    queryKey: portalKeys.athletes(),
    queryFn: async () => {
      const response = await api.get('/api/portal/athletes');
      return response.data;
    },
  });
}
