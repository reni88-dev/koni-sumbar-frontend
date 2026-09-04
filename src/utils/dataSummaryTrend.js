const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const INDONESIAN_DATE_FORMATTER = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const TREND_GRANULARITY_DAILY = 'daily';
export const TREND_GRANULARITY_MONTHLY = 'monthly';
export const DEFAULT_TREND_PRESET = 'monthly-12';
export const TREND_PRESET_OPTIONS = [
  { value: 'daily-current', label: 'Harian — Bulan berjalan', granularity: TREND_GRANULARITY_DAILY, months: 1 },
  { value: 'monthly-6', label: 'Bulanan — 6 bulan', granularity: TREND_GRANULARITY_MONTHLY, months: 6 },
  { value: DEFAULT_TREND_PRESET, label: 'Bulanan — 12 bulan', granularity: TREND_GRANULARITY_MONTHLY, months: 12 },
  { value: 'monthly-24', label: 'Bulanan — 24 bulan', granularity: TREND_GRANULARITY_MONTHLY, months: 24 },
];

function padTwo(value) {
  return String(value).padStart(2, '0');
}

function formatISODateParts(year, month, day) {
  return `${String(year).padStart(4, '0')}-${padTwo(month)}-${padTwo(day)}`;
}

export function parseISODate(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  const match = ISO_DATE_PATTERN.exec(normalized);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day, epochDay: date.getTime() / DAY_MS };
}

export function getJakartaToday(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) return '';
  const parts = Object.fromEntries(
    JAKARTA_DATE_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function subtractCalendarMonthsFromFirst(date, months) {
  const absoluteMonth = date.year * 12 + (date.month - 1) - months;
  const year = Math.floor(absoluteMonth / 12);
  const month = absoluteMonth - year * 12 + 1;
  return formatISODateParts(year, month, 1);
}

export function calendarMonthCount(startDate, endDate) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  if (!start || !end || start.epochDay > end.epochDay) return 0;
  return (end.year - start.year) * 12 + end.month - start.month + 1;
}

export function buildTrendPreset(presetValue = DEFAULT_TREND_PRESET, now = new Date()) {
  const preset = TREND_PRESET_OPTIONS.find((option) => option.value === presetValue);
  if (!preset) throw new Error(`Preset tren tidak dikenal: ${presetValue}`);

  const endDate = getJakartaToday(now);
  const end = parseISODate(endDate);
  if (!end) throw new Error('Tanggal hari ini tidak valid.');
  const startDate = preset.granularity === TREND_GRANULARITY_DAILY
    ? formatISODateParts(end.year, end.month, 1)
    : subtractCalendarMonthsFromFirst(end, preset.months - 1);

  return {
    preset: preset.value,
    granularity: preset.granularity,
    startDate,
    endDate,
    periodMonths: calendarMonthCount(startDate, endDate),
    isCustom: false,
  };
}

function invalidRange(error) {
  return { isValid: false, error, dayCount: 0, monthCount: 0 };
}

export function validateTrendDateRange({ granularity, startDate, endDate, today = getJakartaToday() }) {
  if (granularity !== TREND_GRANULARITY_DAILY && granularity !== TREND_GRANULARITY_MONTHLY) {
    return invalidRange('Granularitas tren tidak valid.');
  }
  if (!startDate || !endDate) {
    return invalidRange('Tanggal mulai dan tanggal akhir wajib diisi.');
  }

  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const current = parseISODate(today);
  if (!start || !end || !current) {
    return invalidRange('Format tanggal tidak valid.');
  }
  if (start.epochDay > end.epochDay) {
    return invalidRange('Tanggal mulai tidak boleh melewati tanggal akhir.');
  }
  if (end.epochDay > current.epochDay) {
    return invalidRange('Tanggal akhir tidak boleh melewati hari ini.');
  }

  const dayCount = end.epochDay - start.epochDay + 1;
  const monthCount = (end.year - start.year) * 12 + end.month - start.month + 1;
  if (granularity === TREND_GRANULARITY_DAILY && dayCount > 31) {
    return invalidRange('Mode Harian maksimal mencakup 31 tanggal inklusif.');
  }
  if (granularity === TREND_GRANULARITY_MONTHLY && monthCount > 24) {
    return invalidRange('Mode Bulanan maksimal mencakup 24 bulan kalender.');
  }

  return { isValid: true, error: '', dayCount, monthCount };
}

export function formatIndonesianDate(value) {
  if (!parseISODate(value)) return '-';
  return INDONESIAN_DATE_FORMATTER.format(new Date(`${value}T00:00:00+07:00`));
}

export function formatTrendDateRange(startDate, endDate) {
  if (!parseISODate(startDate) || !parseISODate(endDate)) return 'Rentang tidak tersedia';
  return `${formatIndonesianDate(startDate)} — ${formatIndonesianDate(endDate)}`;
}

function getNiceIntegerStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 1) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const factor = normalized <= 1
    ? 1
    : normalized <= 2
      ? 2
      : normalized <= 2.5
        ? 2.5
        : normalized <= 5
          ? 5
          : 10;

  return Math.max(1, Math.ceil(factor * magnitude));
}

export function buildIntegerTrendScale(values, targetTickCount = 5) {
  const source = Array.isArray(values) ? values : [values];
  const numericValues = source
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0);
  const dataMaximum = Math.max(0, ...numericValues);

  if (dataMaximum === 0) {
    return { dataMaximum: 0, maximum: 1, step: 1, ticks: [0, 1] };
  }

  const tickCount = Math.max(2, Math.floor(Number(targetTickCount) || 5));
  const step = getNiceIntegerStep(dataMaximum / (tickCount - 1));
  const maximum = Math.ceil(dataMaximum / step) * step;
  const ticks = Array.from(
    { length: Math.floor(maximum / step) + 1 },
    (_, index) => index * step,
  );

  return { dataMaximum, maximum, step, ticks };
}
export function getSampledTrendLabelIndexes(itemCount, maximumLabels = 12) {
  const count = Math.max(0, Math.floor(Number(itemCount) || 0));
  const limit = Math.max(1, Math.floor(Number(maximumLabels) || 1));
  if (count <= limit) return Array.from({ length: count }, (_, index) => index);
  if (limit === 1) return [0];

  const indexes = new Set();
  for (let index = 0; index < limit; index += 1) {
    indexes.add(Math.round((index * (count - 1)) / (limit - 1)));
  }
  return [...indexes].sort((left, right) => left - right);
}
