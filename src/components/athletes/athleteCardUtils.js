import api from '../../api/axios';

export function athleteCardPublicUrl(token) {
  return `${window.location.origin}/kartu/${token}`;
}

export function athleteCardPhotoSrc(photoUrl) {
  return photoUrl ? `${api.defaults.baseURL}${photoUrl}` : '';
}

export function formatCardDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
