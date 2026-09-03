import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveClusterHistory,
  getDevelopmentEligibility,
  getDevelopmentPeriods,
  getLatestHistoricalDevelopmentDate,
  isDateInDevelopmentPeriods,
  normalizeISODate,
} from './clusterDevelopment.js';

const histories = [
  {
    id: 1,
    start_date: '2024-01-01',
    end_date: '2024-03-31',
    is_development_cluster: true,
  },
  {
    id: 2,
    start_date: '2024-04-01',
    end_date: '2024-05-31',
    is_development_cluster: false,
  },
  {
    id: 3,
    start_date: '2024-06-01',
    end_date: '2024-08-15',
    is_development_cluster: true,
  },
  {
    id: 4,
    start_date: '2024-08-16',
    end_date: null,
    is_development_cluster: false,
  },
];

test('active history is the record without end_date', () => {
  assert.equal(getActiveClusterHistory(histories)?.id, 4);
  assert.equal(getActiveClusterHistory(histories.filter((history) => history.end_date)), null);
});

test('eligibility treats active development and non-development statuses correctly', () => {
  const nonDevelopment = getDevelopmentEligibility(histories);
  assert.equal(nonDevelopment.isCurrentlyDevelopment, false);
  assert.equal(nonDevelopment.activeHistory?.id, 4);

  const activeDevelopment = getDevelopmentEligibility([
    ...histories.slice(0, 3),
    { id: 5, start_date: '2024-08-16', end_date: null, is_development_cluster: true },
  ]);
  assert.equal(activeDevelopment.isCurrentlyDevelopment, true);

  const noActiveHistory = getDevelopmentEligibility(histories.slice(0, 3));
  assert.equal(noActiveHistory.isCurrentlyDevelopment, false);
  assert.equal(noActiveHistory.activeHistory, null);
});

test('development periods include multiple valid ranges and are sorted', () => {
  const periods = getDevelopmentPeriods([
    histories[2],
    { id: 99, start_date: 'invalid', end_date: null, is_development_cluster: true },
    { id: 98, start_date: '2024-12-31', end_date: '2024-01-01', is_development_cluster: true },
    histories[0],
    histories[1],
  ]);

  assert.deepEqual(periods, [
    { historyId: 1, startDate: '2024-01-01', endDate: '2024-03-31' },
    { historyId: 3, startDate: '2024-06-01', endDate: '2024-08-15' },
  ]);
});

test('date validation is inclusive and rejects gaps between periods', () => {
  const periods = getDevelopmentPeriods(histories);
  assert.equal(isDateInDevelopmentPeriods('2024-01-01', periods), true);
  assert.equal(isDateInDevelopmentPeriods('2024-03-31', periods), true);
  assert.equal(isDateInDevelopmentPeriods('2024-06-01', periods), true);
  assert.equal(isDateInDevelopmentPeriods('2024-08-15', periods), true);
  assert.equal(isDateInDevelopmentPeriods('2023-12-31', periods), false);
  assert.equal(isDateInDevelopmentPeriods('2024-04-15', periods), false);
  assert.equal(isDateInDevelopmentPeriods('2024-08-16', periods), false);
  assert.equal(isDateInDevelopmentPeriods('not-a-date', periods), false);
});

test('open development period accepts dates from its start onward', () => {
  const periods = getDevelopmentPeriods([
    { id: 7, start_date: '2026-01-10T00:00:00Z', end_date: null, is_development_cluster: true },
  ]);
  assert.equal(isDateInDevelopmentPeriods('2026-01-09', periods), false);
  assert.equal(isDateInDevelopmentPeriods('2026-01-10', periods), true);
  assert.equal(isDateInDevelopmentPeriods('2030-12-31', periods), true);
});

test('latest historical date uses the newest ended development period', () => {
  const periods = getDevelopmentPeriods(histories);
  assert.equal(getLatestHistoricalDevelopmentDate(periods), '2024-08-15');
  assert.equal(getLatestHistoricalDevelopmentDate([{ startDate: '2026-01-01', endDate: null }]), '');
});

test('normalizeISODate only returns valid ISO-shaped dates', () => {
  assert.equal(normalizeISODate('2026-09-03T10:20:30+07:00'), '2026-09-03');
  assert.equal(normalizeISODate('03-09-2026'), '');
  assert.equal(normalizeISODate(null), '');
});