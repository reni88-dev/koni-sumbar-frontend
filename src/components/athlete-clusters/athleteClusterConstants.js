export const CLUSTER_TYPES = [
  { value: 'koni_development', label: 'Atlet Binaan KONI' },
  { value: 'non_development', label: 'Atlet Non Binaan' },
];

export const SUB_CLUSTER_TYPES = [
  { value: 'andalan', label: 'Andalan' },
  { value: 'prioritas', label: 'Prioritas' },
];

export const CHANGE_TYPES = [
  { value: 'initial_assignment', label: 'Penetapan Awal' },
  { value: 'promoted', label: 'Naik Level' },
  { value: 'demoted', label: 'Turun Level' },
  { value: 'removed', label: 'Dikeluarkan dari Binaan' },
  { value: 'reinstated', label: 'Masuk Kembali' },
  { value: 'updated', label: 'Perubahan Data' },
];

export const DECREE_TYPES = [
  { value: 'assignment', label: 'SK Masuk Binaan' },
  { value: 'level_change', label: 'SK Perubahan Level' },
  { value: 'removal', label: 'SK Keluar Binaan' },
  { value: 'reinstatement', label: 'SK Masuk Kembali' },
  { value: 'other', label: 'Lainnya' },
];

export const clusterLabel = (value) => CLUSTER_TYPES.find((item) => item.value === value)?.label || '-';
export const subClusterLabel = (value) => SUB_CLUSTER_TYPES.find((item) => item.value === value)?.label || '-';
export const changeTypeLabel = (value) => CHANGE_TYPES.find((item) => item.value === value)?.label || value || '-';
