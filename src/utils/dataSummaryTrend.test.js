import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TREND_PRESET,
  buildIntegerTrendScale,
  buildTrendPreset,
  getJakartaToday,
  getSampledTrendLabelIndexes,
  validateTrendDateRange,
} from './dataSummaryTrend.js';

const NOW = new Date('2026-09-03T16:30:00.000Z');
const TODAY = '2026-09-03';

test('default preset is monthly twelve months through today in Jakarta', () => {
  const preset = buildTrendPreset(DEFAULT_TREND_PRESET, NOW);
  assert.deepEqual(preset, {
    preset: 'monthly-12',
    granularity: 'monthly',
    startDate: '2025-10-01',
    endDate: TODAY,
    periodMonths: 12,
    isCustom: false,
  });
});

test('daily preset starts on the first date of the current Jakarta month', () => {
  const preset = buildTrendPreset('daily-current', NOW);
  assert.equal(preset.granularity, 'daily');
  assert.equal(preset.startDate, '2026-09-01');
  assert.equal(preset.endDate, TODAY);
});

test('daily validation accepts one and thirty one dates but rejects thirty two', () => {
  assert.deepEqual(
    validateTrendDateRange({ granularity: 'daily', startDate: TODAY, endDate: TODAY, today: TODAY }),
    { isValid: true, error: '', dayCount: 1, monthCount: 1 },
  );
  assert.equal(validateTrendDateRange({ granularity: 'daily', startDate: '2026-08-04', endDate: TODAY, today: TODAY }).isValid, true);
  const invalid = validateTrendDateRange({ granularity: 'daily', startDate: '2026-08-03', endDate: TODAY, today: TODAY });
  assert.equal(invalid.isValid, false);
  assert.match(invalid.error, /31/);
});

test('monthly validation accepts twenty four touched months but rejects twenty five', () => {
  const valid = validateTrendDateRange({ granularity: 'monthly', startDate: '2024-10-31', endDate: TODAY, today: TODAY });
  assert.equal(valid.isValid, true);
  assert.equal(valid.monthCount, 24);
  const invalid = validateTrendDateRange({ granularity: 'monthly', startDate: '2024-09-30', endDate: TODAY, today: TODAY });
  assert.equal(invalid.isValid, false);
  assert.match(invalid.error, /24/);
});

test('date validation rejects empty, invalid, reversed, and future values', () => {
  for (const range of [
    { startDate: '', endDate: TODAY },
    { startDate: TODAY, endDate: '' },
    { startDate: '2026-02-30', endDate: TODAY },
    { startDate: TODAY, endDate: '2026-09-02' },
    { startDate: TODAY, endDate: '2026-09-04' },
  ]) {
    assert.equal(validateTrendDateRange({ granularity: 'daily', today: TODAY, ...range }).isValid, false);
  }
});

test('Jakarta today changes at UTC+7 midnight', () => {
  assert.equal(getJakartaToday(new Date('2026-09-03T16:59:59.000Z')), '2026-09-03');
  assert.equal(getJakartaToday(new Date('2026-09-03T17:00:00.000Z')), '2026-09-04');
});

test('adaptive label sampling keeps both edges and no more than twelve labels', () => {
  const indexes = getSampledTrendLabelIndexes(31, 12);
  assert.equal(indexes[0], 0);
  assert.equal(indexes.at(-1), 30);
  assert.ok(indexes.length <= 12);
  assert.deepEqual(getSampledTrendLabelIndexes(3, 12), [0, 1, 2]);
});

test('integer trend scale uses readable whole-number ticks and covers the data maximum', () => {
  const scale = buildIntegerTrendScale([0, 7, 19, 37]);
  assert.equal(scale.dataMaximum, 37);
  assert.equal(scale.maximum, 40);
  assert.equal(scale.step, 10);
  assert.equal(scale.ticks.at(-1), scale.maximum);
  assert.ok(scale.ticks.every(Number.isInteger));
});

test('integer trend scale keeps an exact readable maximum when possible', () => {
  const scale = buildIntegerTrendScale([25, 50, 100]);
  assert.equal(scale.maximum, 100);
  assert.equal(scale.step, 25);
  assert.deepEqual(scale.ticks, [0, 25, 50, 75, 100]);
});

test('integer trend scale gives all-zero data a safe zero-to-one range', () => {
  assert.deepEqual(buildIntegerTrendScale([0, 0, 0]), {
    dataMaximum: 0,
    maximum: 1,
    step: 1,
    ticks: [0, 1],
  });
});

test('integer trend scale remains useful for small and large value ranges', () => {
  assert.deepEqual(buildIntegerTrendScale([0, 1, 2]), {
    dataMaximum: 2,
    maximum: 2,
    step: 1,
    ticks: [0, 1, 2],
  });

  assert.deepEqual(buildIntegerTrendScale([123456]), {
    dataMaximum: 123456,
    maximum: 150000,
    step: 50000,
    ticks: [0, 50000, 100000, 150000],
  });
});