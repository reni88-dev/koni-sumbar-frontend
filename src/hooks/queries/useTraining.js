import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const trainingKeys = {
  all: ['training'],
  sessions: () => [...trainingKeys.all, 'sessions'],
  sessionList: (filters) => [...trainingKeys.sessions(), filters],
  session: (id) => [...trainingKeys.all, 'session', id],
  attendances: (id) => [...trainingKeys.all, 'attendances', id],
  report: (filters) => [...trainingKeys.all, 'report', filters],
  athletes: (caborId) => [...trainingKeys.all, 'athletes', caborId],
  schedules: () => [...trainingKeys.all, 'schedules'],
  scheduleList: (filters) => [...trainingKeys.schedules(), filters],
  schedule: (id) => [...trainingKeys.all, 'schedule', id],
};

export function useTrainingSessions({ page = 1, limit = 10, coachId, caborId, status, search } = {}) {
  return useQuery({
    queryKey: trainingKeys.sessionList({ page, limit, coachId, caborId, status, search }),
    queryFn: async () => {
      const params = { page, limit };
      if (coachId) params.coach_id = coachId;
      if (caborId) params.cabor_id = caborId;
      if (status) params.status = status;
      if (search) params.search = search;
      const response = await api.get('/api/training/sessions', { params });
      return response.data;
    },
  });
}

export function useTrainingSession(id) {
  return useQuery({
    queryKey: trainingKeys.session(id),
    queryFn: async () => {
      const response = await api.get(`/api/training/sessions/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useTrainingAttendances(sessionId) {
  return useQuery({
    queryKey: trainingKeys.attendances(sessionId),
    queryFn: async () => {
      const response = await api.get(`/api/training/sessions/${sessionId}/attendances`);
      return response.data;
    },
    enabled: !!sessionId,
  });
}

export function useTrainingAthletesByCabor(caborId) {
  return useQuery({
    queryKey: trainingKeys.athletes(caborId),
    queryFn: async () => {
      const response = await api.get('/api/training/athletes', { params: { cabor_id: caborId } });
      return response.data;
    },
    enabled: !!caborId,
  });
}

export function useTrainingReport({ type = 'athlete', caborId, dateFrom, dateTo } = {}) {
  return useQuery({
    queryKey: trainingKeys.report({ type, caborId, dateFrom, dateTo }),
    queryFn: async () => {
      const params = { type };
      if (caborId) params.cabor_id = caborId;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const response = await api.get('/api/training/report', { params });
      return response.data;
    },
  });
}

export function useCreateTrainingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/training/sessions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
    },
  });
}

export function useUpdateTrainingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/training/sessions/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.session(id) });
    },
  });
}

export function useDeleteTrainingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/training/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
    },
  });
}

export function useCheckinTrainingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, latitude, longitude }) => {
      const response = await api.post(`/api/training/sessions/${id}/checkin`, { latitude, longitude });
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.session(id) });
    },
  });
}

export function useCompleteTrainingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/api/training/sessions/${id}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
    },
  });
}

export function useSubmitAttendances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, attendances }) => {
      const response = await api.post(`/api/training/sessions/${sessionId}/attendances`, { attendances });
      return response.data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.attendances(sessionId) });
      queryClient.invalidateQueries({ queryKey: trainingKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
    },
  });
}

export function useUploadTrainingPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, formData }) => {
      const response = await api.post(`/api/training/sessions/${sessionId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.session(sessionId) });
    },
  });
}

// ============ SCHEDULE HOOKS ============

export function useTrainingSchedules({ page = 1, limit = 10, coachId, caborId } = {}) {
  return useQuery({
    queryKey: trainingKeys.scheduleList({ page, limit, coachId, caborId }),
    queryFn: async () => {
      const params = { page, limit };
      if (coachId) params.coach_id = coachId;
      if (caborId) params.cabor_id = caborId;
      const response = await api.get('/api/training/schedules', { params });
      return response.data;
    },
  });
}

export function useCreateTrainingSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/training/schedules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.schedules() });
    },
  });
}

export function useUpdateTrainingSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/training/schedules/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.schedule(id) });
    },
  });
}

export function useDeleteTrainingSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/training/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.schedules() });
    },
  });
}

export function useGenerateScheduleSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ scheduleId, dateFrom, dateTo }) => {
      const response = await api.post(`/api/training/schedules/${scheduleId}/generate`, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trainingKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: trainingKeys.schedules() });
    },
  });
}
