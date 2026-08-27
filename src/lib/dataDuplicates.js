export function duplicateRecordKey(record) {
  if (!record?.entity_type || !record?.id) return '';
  return `${record.entity_type}:${record.id}`;
}

export function isGuidedDuplicateResolution(candidate) {
  if (!candidate || candidate.entity === 'dual_role') return false;
  if (candidate.entity !== 'athlete' && candidate.entity !== 'coach') return false;
  if (candidate.review?.status !== 'same_person' || candidate.review?.stale) return false;
  return candidate.record_a?.entity_type === candidate.entity
    && candidate.record_b?.entity_type === candidate.entity;
}

export function duplicateLoginRecommendation(candidate) {
  if (!isGuidedDuplicateResolution(candidate)) return null;
  const first = candidate.record_a;
  const second = candidate.record_b;
  if (!first?.account?.linked || !second?.account?.linked) return null;
  if (Boolean(first.account.has_logged_in) === Boolean(second.account.has_logged_in)) return null;
  const keep = first.account.has_logged_in ? first : second;
  const remove = keep === first ? second : first;
  return {
    keepKey: duplicateRecordKey(keep),
    deleteKey: duplicateRecordKey(remove),
  };
}

export function duplicateDeleteConfirmation(record) {
  if (!record) return '';
  const entity = record.entity_type === 'coach' ? 'PELATIH' : 'ATLET';
  return `HAPUS ${entity} #${record.id}`;
}
