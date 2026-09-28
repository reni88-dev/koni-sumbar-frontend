function hasValue(value) {
  if (typeof value === 'string') return value.trim() !== '';
  return Boolean(value);
}

export function getBPJSRequirements({
  mode = 'admin',
  useAdminRules = mode === 'admin',
  bpjsNumber,
  bpjsDocumentFile,
  storedBPJSDocument,
  deferredAcknowledged = false,
  requireMatchingPair = false,
} = {}) {
  const numberAvailable = hasValue(bpjsNumber);
  const documentAvailable = hasValue(bpjsDocumentFile) || hasValue(storedBPJSDocument);
  const usesAdminRules = Boolean(useAdminRules);
  const documentRequired = usesAdminRules && requireMatchingPair && numberAvailable && !documentAvailable;
  const deferredAcknowledgementRequired = usesAdminRules && (
    requireMatchingPair
      ? !numberAvailable && !documentAvailable
      : !documentAvailable
  );

  return {
    numberAvailable,
    documentAvailable,
    numberRequired: usesAdminRules && documentAvailable,
    documentRequired,
    deferredAcknowledgementRequired,
    deferredAcknowledgementValid: !deferredAcknowledgementRequired || deferredAcknowledged,
  };
}

export function nextBPJSDeferredAcknowledgement(currentValue, event) {
  if (event === 'acknowledge') return true;
  if (event === 'reset' || event === 'file-selected' || event === 'number-entered') return false;
  return Boolean(currentValue);
}
export function getInitialBPJSNumber(athlete) {
  return athlete?.bpjs_number || '';
}

export function getInitialBPJSDeferredAcknowledgement(athlete) {
  return Boolean(athlete?.bpjs_deferred_acknowledged);
}

export function serializeBPJSDeferredAcknowledgement(value) {
  return value ? '1' : '0';
}
