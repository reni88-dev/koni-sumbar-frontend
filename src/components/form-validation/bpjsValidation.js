function hasDocument(value) {
  if (typeof value === 'string') return value.trim() !== '';
  return Boolean(value);
}


export function getBPJSRequirements({
  mode = 'admin',
  bpjsDocumentFile,
  storedBPJSDocument,
  deferredAcknowledged = false,
} = {}) {
  const documentAvailable = hasDocument(bpjsDocumentFile) || hasDocument(storedBPJSDocument);
  const usesAdminRules = mode === 'admin';
  const deferredAcknowledgementRequired = usesAdminRules && !documentAvailable;

  return {
    documentAvailable,
    numberRequired: usesAdminRules && documentAvailable,
    deferredAcknowledgementRequired,
    deferredAcknowledgementValid: !deferredAcknowledgementRequired || deferredAcknowledged,
  };
}


export function nextBPJSDeferredAcknowledgement(currentValue, event) {
  if (event === 'acknowledge') return true;
  if (event === 'reset' || event === 'file-selected') return false;
  return Boolean(currentValue);
}
