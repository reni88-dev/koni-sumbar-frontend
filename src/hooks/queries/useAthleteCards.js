import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const athleteCardKeys = {
  all: ['athlete-cards'],
  settings: () => ['athlete-cards', 'settings'],
  public: (token) => ['athlete-cards', 'public', token],
};

// Menyiapkan batch kartu (token QR + data) sesuai filter atau daftar atlet; scope ditegakkan backend.
export function useAthleteCardBatch() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/api/athlete-cards/render-data', payload)).data,
  });
}

// Tanggal "Berlaku s.d." global: { valid_until, source: 'database' | 'env' | 'none', can_edit }.
export function useAthleteCardSettings() {
  return useQuery({
    queryKey: athleteCardKeys.settings(),
    queryFn: async () => (await api.get('/api/athlete-cards/settings')).data,
  });
}

// Mengubah tanggal global; string kosong menghapus tanggal tersimpan (kembali ke fallback server).
export function useUpdateAthleteCardSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (validUntil) => (await api.put('/api/athlete-cards/settings', { valid_until: validUntil })).data,
    onSuccess: (data) => {
      queryClient.setQueryData(athleteCardKeys.settings(), data);
      // Halaman publik menampilkan tanggal terkini; buang cache yang basi.
      queryClient.removeQueries({ queryKey: [...athleteCardKeys.all, 'public'] });
    },
  });
}

// Halaman publik hasil scan QR; tanpa login.
export function usePublicAthleteCard(token) {
  return useQuery({
    queryKey: athleteCardKeys.public(token),
    queryFn: async () => (await api.get(`/api/public/athlete-cards/${encodeURIComponent(token)}`)).data,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });
}
