import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const organizationKeys = {
  all: ['organizations'],
  lists: () => [...organizationKeys.all, 'list'],
  list: (filters) => [...organizationKeys.lists(), filters],
  allDropdown: () => [...organizationKeys.all, 'dropdown'],
  children: (parentId) => [...organizationKeys.all, 'children', parentId],
};

// Fetch organizations with pagination
export function useOrganizations({ page = 1, search = '', perPage = 15, type = '' } = {}) {
  return useQuery({
    queryKey: organizationKeys.list({ page, search, perPage, type }),
    queryFn: async () => {
      const response = await api.get('/api/master/organizations', {
        params: { page, search: search || undefined, per_page: perPage, type: type || undefined }
      });
      return response.data;
    },
  });
}

// Fetch all organizations for dropdown
export function useOrganizationsAll({ type = '', parent_id = '', region_id = '' } = {}) {
  return useQuery({
    queryKey: [...organizationKeys.allDropdown(), { type, parent_id, region_id }],
    queryFn: async () => {
      const response = await api.get('/api/organizations/all', {
        params: { 
          type: type || undefined, 
          parent_id: parent_id || undefined, 
          region_id: region_id || undefined 
        }
      });
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Fetch children of an organization
export function useOrganizationChildren(parentId) {
  return useQuery({
    queryKey: organizationKeys.children(parentId),
    queryFn: async () => {
      const response = await api.get(`/api/master/organizations/${parentId}/children`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!parentId,
  });
}

// Create organization mutation
export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/organizations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

// Update organization mutation
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/organizations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

// Delete organization mutation
export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

// Link cabor to organization
export function useLinkCabor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, caborId }) => {
      const response = await api.post(`/api/master/organizations/${orgId}/cabors`, { cabor_id: caborId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}

// Unlink cabor from organization
export function useUnlinkCabor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, caborId }) => {
      await api.delete(`/api/master/organizations/${orgId}/cabors`, { data: { cabor_id: caborId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
}
