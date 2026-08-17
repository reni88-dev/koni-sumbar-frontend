import { useCallback, useState } from 'react';
import api from '../../api/axios';

export function useAthleteLookups() {
  const [cabors, setCabors] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [competitionClasses, setCompetitionClasses] = useState([]);

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

  const fetchEducationLevels = useCallback(async () => {
    try {
      const response = await api.get('/api/education-levels/all');
      const data = Array.isArray(response.data)
        ? response.data.filter((item) => item && item.id)
        : [];
      setEducationLevels(data);
    } catch (error) {
      console.error('Failed to fetch education levels:', error);
      setEducationLevels([]);
    }
  }, []);

  const fetchCompetitionClasses = useCallback(async (caborId) => {
    if (!caborId) {
      setCompetitionClasses([]);
      return;
    }
    try {
      const response = await api.get(`/api/competition-classes/all?cabor_id=${caborId}`);
      const data = Array.isArray(response.data)
        ? response.data.filter((item) => item && item.id)
        : [];
      setCompetitionClasses(data);
    } catch (error) {
      console.error('Failed to fetch competition classes:', error);
      setCompetitionClasses([]);
    }
  }, []);

  const clearCompetitionClasses = useCallback(() => setCompetitionClasses([]), []);

  const fetchBaseLookups = useCallback(() => {
    fetchCabors();
    fetchOrganizations();
    fetchEducationLevels();
  }, [fetchCabors, fetchEducationLevels, fetchOrganizations]);

  return {
    cabors,
    organizations,
    educationLevels,
    competitionClasses,
    fetchBaseLookups,
    fetchCompetitionClasses,
    clearCompetitionClasses
  };
}

