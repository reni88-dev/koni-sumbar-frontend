export function getCoachPhotoUrl(coach) {
  const photo = typeof coach?.photo === 'string' ? coach.photo.trim() : '';
  if (!photo) return null;

  if (photo.startsWith('/api/')) {
    return photo;
  }

  if (!coach?.id) return null;

  const endpoint = `/api/coaches/${encodeURIComponent(coach.id)}/photo`;
  const version = coach.updated_at ? String(coach.updated_at).trim() : '';

  return version
    ? `${endpoint}?t=${encodeURIComponent(version)}`
    : endpoint;
}