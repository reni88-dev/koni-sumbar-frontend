import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// ==================== EDUCATION LEVELS ====================
export const educationLevelKeys = {
  all: ['educationLevels'],
  lists: () => [...educationLevelKeys.all, 'list'],
  list: (filters) => [...educationLevelKeys.lists(), filters],
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

export function useRolesAll() {
  return useQuery({
    queryKey: roleKeys.allDropdown(),
    queryFn: async () => {
      const response = await api.get('/api/master/roles/all');
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
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

// ==================== PERMISSIONS ====================
export const permissionKeys = {
  all: ['permissions'],
  grouped: () => [...permissionKeys.all, 'grouped'],
};

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.all,
    queryFn: async () => {
      const response = await api.get('/api/master/permissions');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // Permissions rarely change
  });
}

export function usePermissionsGrouped() {
  return useQuery({
    queryKey: permissionKeys.grouped(),
    queryFn: async () => {
      const response = await api.get('/api/master/permissions');
      return response.data;
    },
    staleTime: 30 * 60 * 1000,
  });
}


// ==================== USERS ====================
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), filters],
};

export function useUsers({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: userKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/users', {
        params: { page, search: search || undefined, per_page: perPage }
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

// ==================== COMPETITION CLASSES ====================
export const competitionClassKeys = {
  all: ['competitionClasses'],
  lists: () => [...competitionClassKeys.all, 'list'],
  list: (filters) => [...competitionClassKeys.lists(), filters],
  byCabor: (caborId) => [...competitionClassKeys.all, 'byCabor', caborId],
};

export function useCompetitionClasses({ page = 1, search = '', caborId = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: competitionClassKeys.list({ page, search, caborId, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/competition-classes', {
        params: { 
          page, 
          search: search || undefined, 
          cabor_id: caborId || undefined,
          per_page: perPage 
        }
      });
      return response.data;
    },
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
