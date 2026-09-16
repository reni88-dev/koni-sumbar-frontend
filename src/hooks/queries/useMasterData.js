import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { buildRolesAccessRequest } from '../../lib/roleAccess';

// ==================== EDUCATION LEVELS ====================
export const educationLevelKeys = {
  all: ['educationLevels'],
  lists: () => [...educationLevelKeys.all, 'list'],
  list: (filters) => [...educationLevelKeys.lists(), filters],
  allDropdown: () => [...educationLevelKeys.all, 'dropdown'],
};

export function useEducationLevels({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: educationLevelKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/education-levels', {
        params: { page, search: search || undefined, per_page: perPage }
      });
      return response.data;
    },
  });
}

export function useEducationLevelsAll() {
  return useQuery({
    queryKey: educationLevelKeys.allDropdown(),
    queryFn: async () => {
      const response = await api.get('/api/education-levels/all');
      return Array.isArray(response.data) ? response.data.filter(level => level && level.id) : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateEducationLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/education-levels', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationLevelKeys.all });
    },
  });
}

export function useUpdateEducationLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/education-levels/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationLevelKeys.all });
    },
  });
}

export function useDeleteEducationLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/education-levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educationLevelKeys.all });
    },
  });
}

// ==================== ROLES ====================
export const roleKeys = {
  all: ['roles'],
  lists: () => [...roleKeys.all, 'list'],
  list: (filters) => [...roleKeys.lists(), filters],
  allDropdown: () => [...roleKeys.all, 'dropdown'],
};

export function useRoles({ page = 1, search = '' } = {}) {
  return useQuery({
    queryKey: roleKeys.list({ page, search }),
    queryFn: async () => {
      const response = await api.get('/api/master/roles', {
        params: { page, search: search || undefined }
      });
      return response.data;
    },
  });
}

export function useRolesAll({ enabled = true } = {}) {
  return useQuery({
    queryKey: roleKeys.allDropdown(),
    queryFn: async () => {
      const response = await api.get('/api/master/roles/all');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/roles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissions }) => {
      const response = await api.put(`/api/master/roles/${roleId}/permissions`, { permissions });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useSetRoleAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, accessEnabled, accessDisabledMessage = '' }) => {
      const response = await api.put(`/api/master/roles/${roleId}/access`, {
        access_enabled: accessEnabled,
        access_disabled_message: accessDisabledMessage,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useSetRolesAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleIds, accessEnabled, accessDisabledMessage = '' }) => {
      const request = buildRolesAccessRequest({
        roleIds,
        accessEnabled,
        accessDisabledMessage,
      });
      const response = await api.put(request.url, request.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

// ==================== PERMISSIONS ====================
export const permissionKeys = {
  all: ['permissions'],
  grouped: () => [...permissionKeys.all, 'grouped'],
};

export function usePermissions({ enabled = true } = {}) {
  return useQuery({
    queryKey: permissionKeys.all,
    queryFn: async () => {
      const response = await api.get('/api/master/permissions');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // Permissions rarely change
    enabled,
  });
}

export function usePermissionsGrouped({ enabled = true } = {}) {
  return useQuery({
    queryKey: permissionKeys.grouped(),
    queryFn: async () => {
      const response = await api.get('/api/master/permissions');
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
    enabled,
  });
}


// ==================== USERS ====================
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), filters],
};

export function useUsers({ page = 1, search = '', perPage = 10, roleId = '', sort = '' } = {}) {
  return useQuery({
    queryKey: userKeys.list({ page, search, perPage, roleId, sort }),
    queryFn: async () => {
      const response = await api.get('/api/master/users', {
        params: { page, search: search || undefined, per_page: perPage, role_id: roleId || undefined, sort: sort || undefined }
      });
      return response.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useSetUserAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, accessEnabled, accessDisabledMessage = '' }) => {
      const response = await api.put(`/api/master/users/${userId}/access`, {
        access_enabled: accessEnabled,
        access_disabled_message: accessDisabledMessage,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

// ==================== PORPROV COMPETITION CLASS DATA ====================
export const porprovCompetitionClassKeys = {
  all: ['porprovCompetitionClassData'],
  events: () => [...porprovCompetitionClassKeys.all, 'events'],
  eventAthletes: (eventId) => [...porprovCompetitionClassKeys.all, 'eventAthletes', eventId],
};

export function usePorprovEvents({ enabled = true } = {}) {
  return useQuery({
    queryKey: porprovCompetitionClassKeys.events(),
    queryFn: async () => {
      const response = await api.get('/api/porprov/events', {
        params: { per_page: 100 },
      });
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePorprovEventAthletes(eventId, { enabled = true } = {}) {
  return useQuery({
    queryKey: porprovCompetitionClassKeys.eventAthletes(eventId),
    queryFn: async () => {
      const response = await api.get(`/api/porprov/events/${eventId}/athletes`);
      if (Array.isArray(response.data)) return response.data;
      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
    enabled: enabled && !!eventId,
    staleTime: 60 * 1000,
  });
}
// ==================== COMPETITION CLASSES ====================
export const competitionClassKeys = {
  all: ['competitionClasses'],
  lists: () => [...competitionClassKeys.all, 'list'],
  list: (filters) => [...competitionClassKeys.lists(), filters],
  byCabor: (caborId) => [...competitionClassKeys.all, 'byCabor', caborId],
  athletes: (competitionClassId) => [...competitionClassKeys.all, 'athletes', competitionClassId],
};

export function useCompetitionClasses({
  page = 1,
  search = '',
  caborId = '',
  codePresence = '',
  descriptionPresence = '',
  perPage = 10
} = {}) {
  return useQuery({
    queryKey: competitionClassKeys.list({ page, search, caborId, codePresence, descriptionPresence, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/competition-classes', {
        params: { 
          page, 
          search: search || undefined, 
          cabor_id: caborId || undefined,
          code_presence: codePresence || undefined,
          description_presence: descriptionPresence || undefined,
          per_page: perPage 
        }
      });
      return response.data;
    },
  });
}

export function useCompetitionClassAthletes(competitionClassId, { enabled = true } = {}) {
  return useQuery({
    queryKey: competitionClassKeys.athletes(competitionClassId),
    queryFn: async () => {
      const perPage = 100;
      const fetchPage = (page) => api.get('/api/athletes', {
        params: {
          competition_class_id: competitionClassId,
          page,
          per_page: perPage,
        },
      }).then((response) => response.data);

      const firstPage = await fetchPage(1);
      const athletes = Array.isArray(firstPage?.data) ? [...firstPage.data] : [];
      const lastPage = Math.max(1, Number(firstPage?.last_page) || 1);

      if (lastPage > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: lastPage - 1 }, (_, index) => fetchPage(index + 2)),
        );
        remainingPages.forEach((pageData) => {
          if (Array.isArray(pageData?.data)) athletes.push(...pageData.data);
        });
      }

      return athletes;
    },
    enabled: enabled && !!competitionClassId,
  });
}
export function useCompetitionClassesByCabor(caborId) {
  return useQuery({
    queryKey: competitionClassKeys.byCabor(caborId),
    queryFn: async () => {
      const response = await api.get('/api/competition-classes/all', {
        params: { cabor_id: caborId }
      });
      return Array.isArray(response.data) ? response.data.filter(c => c && c.id) : [];
    },
    enabled: !!caborId,
  });
}

export function useCreateCompetitionClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/competition-classes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionClassKeys.all });
    },
  });
}

export function useUpdateCompetitionClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/competition-classes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionClassKeys.all });
    },
  });
}

export function useDeleteCompetitionClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/competition-classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitionClassKeys.all });
    },
  });
}
