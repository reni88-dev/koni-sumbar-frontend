const INDONESIAN_COLLATOR = new Intl.Collator('id', {
  sensitivity: 'base',
  numeric: true,
});

export const SPORT_GROUP_ALL = 'all';
export const SPORT_GROUP_LARGE = 'large';
export const SPORT_GROUP_SMALL = 'small';
export const SPORT_CONTINGENT_INITIAL_LIMIT = 10;

function numericCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function rankSportContingentDistribution(sports = []) {
  return [...sports]
    .sort((left, right) => {
      const countDifference = numericCount(right?.contingent_count) - numericCount(left?.contingent_count);
      if (countDifference !== 0) return countDifference;
      const nameDifference = INDONESIAN_COLLATOR.compare(left?.cabor_name || '', right?.cabor_name || '');
      if (nameDifference !== 0) return nameDifference;
      return Number(left?.cabor_id || 0) - Number(right?.cabor_id || 0);
    })
    .map((sport, index) => ({ ...sport, rank: index + 1 }));
}

export function filterSportContingentDistribution(sports = [], group = SPORT_GROUP_ALL) {
  return rankSportContingentDistribution(sports).filter((sport) => (
    group === SPORT_GROUP_ALL || sport?.group === group
  ));
}

export function buildSportContingentDistributionView(sports = [], {
  group = SPORT_GROUP_ALL,
  expanded = false,
  limit = SPORT_CONTINGENT_INITIAL_LIMIT,
} = {}) {
  const filteredSports = filterSportContingentDistribution(sports, group);
  const parsedLimit = Number(limit);
  const rowLimit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? parsedLimit
    : SPORT_CONTINGENT_INITIAL_LIMIT;
  const overflowCount = Math.max(0, filteredSports.length - rowLimit);
  const visibleSports = expanded
    ? filteredSports
    : filteredSports.slice(0, rowLimit);

  return {
    filteredSports,
    visibleSports,
    hiddenCount: Math.max(0, filteredSports.length - visibleSports.length),
    overflowCount,
    hasOverflow: overflowCount > 0,
  };
}
