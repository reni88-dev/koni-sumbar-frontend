import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

const keys = {
  all: ['porprov-certificates'],
  events: () => [...keys.all, 'events'],
  list: (eventId, params) => [...keys.all, eventId, 'admin', params],
};

// Event Porprov untuk pemilih event; akun dengan permission sertifikat boleh membacanya.
export function usePorprovCertificateEvents(options = {}) {
  return useQuery({
    queryKey: keys.events(),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const response = await api.get('/api/porprov/events', { params: { per_page: 100 } });
      return response.data?.data ?? [];
    },
  });
}

// Daftar sertifikat satu event; backend membatasi hasil sesuai scope akun (kontingen atau cabor).
export function useAdminCertificates(eventId, params, options = {}) {
  return useQuery({
    queryKey: keys.list(eventId, params),
    enabled: !!eventId && (options.enabled ?? true),
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const response = await api.get('/api/porprov/certificates', { params: { event_id: eventId, ...params } });
      return response.data;
    },
  });
}

// kind: 'athlete' | 'official'
export async function fetchAdminCertificatePdf(kind, id) {
  const response = await api.get(`/api/porprov/certificates/${kind}/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}
