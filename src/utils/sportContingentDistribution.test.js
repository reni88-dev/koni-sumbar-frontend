import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPORT_GROUP_LARGE,
  SPORT_GROUP_SMALL,
  buildSportContingentDistributionView,
  filterSportContingentDistribution,
  rankSportContingentDistribution,
} from './sportContingentDistribution.js';

const SPORTS = [
  {
    cabor_id: 1,
    cabor_name: 'Atletik',
    contingent_count: 9,
    athlete_count: 18,
    group: SPORT_GROUP_SMALL,
    contingents: [{ organization_id: 1, name: 'Kota Padang', athlete_count: 4 }],
  },
  {
    cabor_id: 2,
    cabor_name: 'Bola Voli',
    contingent_count: 10,
    athlete_count: 30,
    group: SPORT_GROUP_LARGE,
    contingents: [{ organization_id: 2, name: 'Kabupaten Agam', athlete_count: 6 }],
  },
  {
    cabor_id: 3,
    cabor_name: 'Anggar',
    contingent_count: 9,
    athlete_count: 12,
    group: SPORT_GROUP_SMALL,
    contingents: [{ organization_id: 3, name: 'Kota Bukittinggi', athlete_count: 3 }],
  },
  {
    cabor_id: 4,
    cabor_name: 'Pencak Silat',
    contingent_count: 12,
    athlete_count: 41,
    group: SPORT_GROUP_LARGE,
    contingents: [{ organization_id: 4, name: 'Kabupaten Solok', athlete_count: 5 }],
  },
];

function makeSports(count, groupForIndex = () => SPORT_GROUP_SMALL) {
  return Array.from({ length: count }, (_, index) => ({
    cabor_id: index + 1,
    cabor_name: `Cabor ${String(index + 1).padStart(2, '0')}`,
    contingent_count: count - index,
    athlete_count: (index + 1) * 3,
    group: groupForIndex(index),
    contingents: [{
      organization_id: index + 100,
      name: `Kontingen ${index + 1}`,
      athlete_count: index + 1,
    }],
  }));
}

test('ranking sorts by contingent count descending and alphabetically for ties', () => {
  const ranked = rankSportContingentDistribution(SPORTS);
  assert.deepEqual(ranked.map((sport) => sport.cabor_name), ['Pencak Silat', 'Bola Voli', 'Anggar', 'Atletik']);
  assert.deepEqual(ranked.map((sport) => sport.rank), [1, 2, 3, 4]);
  assert.deepEqual(SPORTS.map((sport) => sport.cabor_name), ['Atletik', 'Bola Voli', 'Anggar', 'Pencak Silat']);
});

test('group filters support all, large, and small while retaining overall ranks', () => {
  assert.deepEqual(
    filterSportContingentDistribution(SPORTS).map((sport) => [sport.cabor_name, sport.rank]),
    [['Pencak Silat', 1], ['Bola Voli', 2], ['Anggar', 3], ['Atletik', 4]],
  );
  assert.deepEqual(
    filterSportContingentDistribution(SPORTS, SPORT_GROUP_LARGE).map((sport) => [sport.cabor_name, sport.rank]),
    [['Pencak Silat', 1], ['Bola Voli', 2]],
  );
  assert.deepEqual(
    filterSportContingentDistribution(SPORTS, SPORT_GROUP_SMALL).map((sport) => [sport.cabor_name, sport.rank]),
    [['Anggar', 3], ['Atletik', 4]],
  );
});

test('contingent details remain available after filtering', () => {
  const filtered = filterSportContingentDistribution(SPORTS, SPORT_GROUP_SMALL);
  assert.deepEqual(filtered[0].contingents, SPORTS[2].contingents);
  assert.deepEqual(filtered[1].contingents, SPORTS[0].contingents);
});

test('exactly ten filtered results show every sport without an overflow control', () => {
  const view = buildSportContingentDistributionView(makeSports(10));

  assert.equal(view.filteredSports.length, 10);
  assert.equal(view.visibleSports.length, 10);
  assert.equal(view.hiddenCount, 0);
  assert.equal(view.overflowCount, 0);
  assert.equal(view.hasOverflow, false);
});

test('eleven filtered results initially show ten sports and one hidden sport', () => {
  const view = buildSportContingentDistributionView(makeSports(11));

  assert.deepEqual(view.visibleSports.map((sport) => sport.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(view.hiddenCount, 1);
  assert.equal(view.overflowCount, 1);
  assert.equal(view.hasOverflow, true);
});

test('expanded view shows all filtered sports and collapsed view returns to ten', () => {
  const sports = makeSports(11);
  const expanded = buildSportContingentDistributionView(sports, { expanded: true });
  const collapsedAgain = buildSportContingentDistributionView(sports, { expanded: false });

  assert.equal(expanded.visibleSports.length, 11);
  assert.equal(expanded.hiddenCount, 0);
  assert.equal(expanded.hasOverflow, true);
  assert.equal(collapsedAgain.visibleSports.length, 10);
  assert.equal(collapsedAgain.hiddenCount, 1);
});

test('group filtering happens before the ten-row limit is applied', () => {
  const sports = makeSports(24, (index) => (
    index % 2 === 0 ? SPORT_GROUP_LARGE : SPORT_GROUP_SMALL
  ));
  const view = buildSportContingentDistributionView(sports, { group: SPORT_GROUP_LARGE });

  assert.equal(view.filteredSports.length, 12);
  assert.equal(view.visibleSports.length, 10);
  assert.equal(view.hiddenCount, 2);
  assert.ok(view.visibleSports.every((sport) => sport.group === SPORT_GROUP_LARGE));
  assert.deepEqual(view.visibleSports.map((sport) => sport.rank), [1, 3, 5, 7, 9, 11, 13, 15, 17, 19]);
});

test('limiting and expanding retain overall ranks and contingent details', () => {
  const sports = makeSports(11);
  const collapsed = buildSportContingentDistributionView(sports);
  const expanded = buildSportContingentDistributionView(sports, { expanded: true });

  assert.equal(collapsed.visibleSports.at(-1).rank, 10);
  assert.strictEqual(collapsed.visibleSports.at(-1).contingents, sports[9].contingents);
  assert.equal(expanded.visibleSports.at(-1).rank, 11);
  assert.strictEqual(expanded.visibleSports.at(-1).contingents, sports[10].contingents);
});
