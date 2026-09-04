const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeISODate(value) {
  if (!value) return '';
  const normalized = String(value).slice(0, 10);
  return ISO_DATE_PATTERN.test(normalized) ? normalized : '';
}

export function getActiveClusterHistory(histories = []) {
  return histories.find((history) => history && !history.end_date) || null;
}

export function getDevelopmentPeriods(histories = []) {
  return histories
    .filter((history) => history?.is_development_cluster)
    .map((history) => ({
      historyId: history.id ?? null,
      startDate: normalizeISODate(history.start_date),
      endDate: normalizeISODate(history.end_date) || null,
    }))
    .filter((period) => period.startDate && (!period.endDate || period.endDate >= period.startDate))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}

export function getDevelopmentEligibility(histories = []) {
  const activeHistory = getActiveClusterHistory(histories);
  return {
    activeHistory,
    isCurrentlyDevelopment: Boolean(activeHistory?.is_development_cluster),
    developmentPeriods: getDevelopmentPeriods(histories),
  };
}

export function isDateInDevelopmentPeriods(value, periods = []) {
  const date = normalizeISODate(value);
  if (!date) return false;

  return periods.some((period) => {
    const startDate = normalizeISODate(period?.startDate ?? period?.start_date);
    const endDate = normalizeISODate(period?.endDate ?? period?.end_date);
    if (!startDate || date < startDate) return false;
    return !endDate || date <= endDate;
  });
}

export function getLatestHistoricalDevelopmentDate(periods = []) {
  const endedPeriods = periods
    .map((period) => ({
      startDate: normalizeISODate(period?.startDate ?? period?.start_date),
      endDate: normalizeISODate(period?.endDate ?? period?.end_date),
    }))
    .filter((period) => period.startDate && period.endDate && period.endDate >= period.startDate)
    .sort((left, right) => right.endDate.localeCompare(left.endDate));

  return endedPeriods[0]?.endDate || '';
}

export function formatDevelopmentPeriod(period) {
  const startDate = normalizeISODate(period?.startDate ?? period?.start_date);
  const endDate = normalizeISODate(period?.endDate ?? period?.end_date);
  if (!startDate) return '';
  return `${formatIndonesianDate(startDate)} - ${endDate ? formatIndonesianDate(endDate) : 'Sekarang'}`;
}

export function formatIndonesianDate(value) {
  const date = normalizeISODate(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${date}T00:00:00+07:00`));
}