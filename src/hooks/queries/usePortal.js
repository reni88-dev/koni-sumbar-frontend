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
  clusters: () => [...portalKeys.all, 'profile', 'clusters'],
  funds: (filters) => [...portalKeys.all, 'profile', 'development-funds', filters],
  coachClusters: () => [...portalKeys.all, 'profile', 'coach-clusters'],
  coachFunds: (filters) => [...portalKeys.all, 'profile', 'coach-development-funds', filters],
};

// Fetch user's portal profile
export function usePortalProfile(options = {}) {
  return useQuery({
    queryKey: portalKeys.profile(),
    enabled: options.enabled ?? true,
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
      queryClient.invalidateQueries({ queryKey: portalKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: portalKeys.events() });
      queryClient.invalidateQueries({ queryKey: portalKeys.athletes() });
    },
  });
}

// Fetch logged-in athlete cluster histories (self-service only)
export function usePortalClusterHistories(options = {}) {
  return useQuery({
    queryKey: portalKeys.clusters(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/profile/clusters');
      return response.data;
    },
  });
}

// Fetch logged-in athlete development funds (self-service only)
export function usePortalDevelopmentFunds(filters = {}, options = {}) {
  return useQuery({
    queryKey: portalKeys.funds(filters),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/profile/development-funds', {
        params: {
          page: filters.page || 1,
          per_page: filters.perPage || 15,
          year: filters.year || undefined,
          month: filters.month || undefined,
        },
      });
      return response.data;
    },
  });
}

export function usePortalCoachClusterHistories(options = {}) {
  return useQuery({
    queryKey: portalKeys.coachClusters(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/profile/coach-clusters');
      return response.data;
    },
  });
}

export function usePortalCoachDevelopmentFunds(filters = {}, options = {}) {
  return useQuery({
    queryKey: portalKeys.coachFunds(filters),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/profile/coach-development-funds', {
        params: {
          page: filters.page || 1,
          per_page: filters.perPage || 15,
          year: filters.year || undefined,
          month: filters.month || undefined,
        },
      });
      return response.data;
    },
  });
}

// Fetch user's events
export function usePortalEvents(options = {}) {
  return useQuery({
    queryKey: portalKeys.events(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/events');
      return response.data;
    },
  });
}

// Fetch user's form submissions
export function usePortalSubmissions(options = {}) {
  return useQuery({
    queryKey: portalKeys.submissions(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/submissions');
      return response.data;
    },
  });
}

// Fetch dashboard stats
export function usePortalDashboard(options = {}) {
  return useQuery({
    queryKey: portalKeys.dashboard(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/dashboard');
      return response.data;
    },
  });
}

// Fetch coach's athletes (coach only)
export function usePortalAthletes(options = {}) {
  return useQuery({
    queryKey: portalKeys.athletes(),
    enabled: options.enabled ?? true,
    queryFn: async () => {
      const response = await api.get('/api/portal/athletes');
      return response.data;
    },
  });
}
