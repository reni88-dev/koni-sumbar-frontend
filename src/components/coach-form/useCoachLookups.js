import { useCallback, useState } from 'react';
import api from '../../api/axios';

export function useCoachLookups() {
  const [cabors, setCabors] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  const fetchCabors = useCallback(async () => {
    try {
      const response = await api.get('/api/cabors/all', { params: { level: 'discipline' } });
      const data = Array.isArray(response.data)
        ? response.data
          .filter((item) => item && item.id)
          .map((item) => ({ ...item, name: item.display_name || item.name }))
        : [];
      setCabors(data);
    } catch (error) {
      console.error('Failed to fetch cabors:', error);
      setCabors([]);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await api.get('/api/organizations/all');
      const data = Array.isArray(response.data)
        ? response.data.filter((item) => item && item.id)
        : [];
      setOrganizations(data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setOrganizations([]);
    }
  }, []);

  const fetchLookups = useCallback(() => {
    fetchCabors();
    fetchOrganizations();
  }, [fetchCabors, fetchOrganizations]);

  return { cabors, organizations, fetchLookups };
}
