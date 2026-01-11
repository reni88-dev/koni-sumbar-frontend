import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const eventKeys = {
  all: ['events'],
  lists: () => [...eventKeys.all, 'list'],
  list: (filters) => [...eventKeys.lists(), filters],
  details: () => [...eventKeys.all, 'detail'],
  detail: (id) => [...eventKeys.details(), id],
  athletes: (id) => [...eventKeys.detail(id), 'athletes'],
  availableAthletes: (id) => [...eventKeys.detail(id), 'availableAthletes'],
};

// Fetch events with pagination
export function useEvents({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: eventKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/events', {
        params: { page, search: search || undefined, per_page: perPage }
      });
      return response.data;
    },
  });
}

// Fetch single event
export function useEvent(id) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/events/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch event athletes
export function useEventAthletes(eventId) {
  return useQuery({
    queryKey: eventKeys.athletes(eventId),
    queryFn: async () => {
      const response = await api.get(`/api/events/${eventId}/athletes`);
      return response.data;
    },
    enabled: !!eventId,
  });
}

// Fetch available athletes for event
export function useAvailableAthletes(eventId) {
  return useQuery({
    queryKey: eventKeys.availableAthletes(eventId),
    queryFn: async () => {
      const response = await api.get(`/api/events/${eventId}/available-athletes`);
      return response.data;
    },
    enabled: !!eventId,
  });
}

// Create event mutation
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/api/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// Update event mutation
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      formData.append('_method', 'PUT');
      const response = await api.post(`/api/events/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
    },
  });
}

// Delete event mutation
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// Register athlete to event
export function useRegisterAthlete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, data }) => {
      const response = await api.post(`/api/events/${eventId}/athletes`, data);
      return response.data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.athletes(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.availableAthletes(eventId) });
    },
  });
}

// Update athlete status in event
export function useUpdateAthleteStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, eventAthleteId, status }) => {
      const response = await api.put(`/api/events/${eventId}/athletes/${eventAthleteId}`, { status });
      return response.data;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.athletes(eventId) });
    },
  });
}

// Remove athlete registration from event
export function useRemoveAthleteFromEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, eventAthleteId }) => {
      await api.delete(`/api/events/${eventId}/athletes/${eventAthleteId}`);
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.athletes(eventId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.availableAthletes(eventId) });
    },
  });
}
