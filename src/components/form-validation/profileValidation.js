export const PROFILE_IDENTITY_PATTERN = /^[0-9]{16}$/;
export const PROFILE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PROFILE_PHONE_INPUT_PATTERN = /^\+?[0-9\s().-]+$/;
export const PROFILE_PHONE_PATTERN = /^628[0-9]{8,11}$/;

export function normalizeProfilePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!PROFILE_PHONE_INPUT_PATTERN.test(raw)) return null;

  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('62')) {
    // Already normalized.
  } else if (phone.startsWith('0')) {
    phone = `62${phone.slice(1)}`;
  } else if (phone.startsWith('8')) {
    phone = `62${phone}`;
  } else {
    return null;
  }
  return PROFILE_PHONE_PATTERN.test(phone) ? phone : null;
}
export function getFieldMeta(metadata, field) {
  return metadata.find((item) => item.name === field) || null;
}

export function humanizeFieldName(field) {
  return String(field || 'formulir')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function orderedValidationEntries(errors = {}, metadata = []) {
  const known = [];
  const unknown = [];
  const positions = new Map(metadata.map((item, index) => [item.name, index]));

  Object.entries(errors).forEach(([field, rawMessages]) => {
    const messages = Array.isArray(rawMessages)
      ? rawMessages.filter(Boolean).map(String)
      : rawMessages
        ? [String(rawMessages)]
        : [];
    if (messages.length === 0) return;

    const meta = getFieldMeta(metadata, field);
    const entry = {
      field,
      label: meta?.label || humanizeFieldName(field),
      messages,
      step: meta?.step ?? null,
      target: meta?.target || null,
      known: Boolean(meta),
    };
    if (meta) known.push(entry);
    else unknown.push(entry);
  });

  known.sort((a, b) => positions.get(a.field) - positions.get(b.field));
  return [...known, ...unknown];
}

export function filterValidationErrorsByStep(errors = {}, metadata = [], step) {
  const allowed = new Set(
    metadata.filter((item) => item.step === step).map((item) => item.name),
  );
  return Object.fromEntries(
    Object.entries(errors).filter(([field]) => allowed.has(field)),
  );
}

export function replaceStepValidationErrors(current = {}, next = {}, metadata = [], step) {
  const stepFields = new Set(
    metadata.filter((item) => item.step === step).map((item) => item.name),
  );
  return {
    ...Object.fromEntries(
      Object.entries(current).filter(([field]) => !stepFields.has(field)),
    ),
    ...next,
  };
}

export function getStepErrorCounts(errors = {}, metadata = []) {
  const counts = {};
  orderedValidationEntries(errors, metadata).forEach((entry) => {
    if (entry.step == null) return;
    counts[entry.step] = (counts[entry.step] || 0) + 1;
  });
  return counts;
}

export function getFieldErrorId(field) {
  return `profile-field-${field}-error`;
}

export function getFieldControlProps(field, errors = {}) {
  const invalid = Boolean(errors[field]);
  return {
    name: field,
    'data-field': field,
    'aria-invalid': invalid || undefined,
    'aria-describedby': invalid ? getFieldErrorId(field) : undefined,
  };
}

function waitForRender() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
      return;
    }
    setTimeout(resolve, 0);
  });
}

function focusSummary(summaryRef) {
  const summary = summaryRef?.current;
  if (!summary) return false;
  summary.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  summary.focus?.({ preventScroll: true });
  return true;
}

export async function focusValidationField({
  field,
  metadata,
  rootRef,
  summaryRef,
  onStepChange,
}) {
  const meta = getFieldMeta(metadata, field);
  if (!meta) {
    await waitForRender();
    focusSummary(summaryRef);
    return false;
  }

  if (meta.step != null && onStepChange) {
    onStepChange(meta.step);
  }
  await waitForRender();

  const root = rootRef?.current;
  if (!root) {
    focusSummary(summaryRef);
    return false;
  }

  const target = root.querySelector(meta.target || `[data-field="${field}"]`);
  if (!target) {
    focusSummary(summaryRef);
    return false;
  }

  const focusable = target.matches?.('input:not([type="hidden"]), select, textarea, button, [tabindex]')
    ? target
    : target.querySelector?.('input:not([type="hidden"]), select, textarea, button, [tabindex]');
  const control = focusable || target;
  control.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  control.focus?.({ preventScroll: true });
  return true;
}
