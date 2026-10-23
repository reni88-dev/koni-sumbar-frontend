const MEDAL_STYLES = {
  1: 'bg-amber-50 text-amber-700 ring-amber-200',
  2: 'bg-slate-100 text-slate-700 ring-slate-300',
  3: 'bg-orange-50 text-orange-700 ring-orange-200',
};

export function certificateBadgeClass(medalRank) {
  const style = MEDAL_STYLES[medalRank] || 'bg-red-50 text-red-700 ring-red-200';
  return `inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${style}`;
}

export function certificateFilename(item) {
  const slug = String(item.recipient_name || 'sertifikat').trim().replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'sertifikat';
  const code = String(item.verify_code || '').replace(/[^A-Za-z0-9]+/g, '');
  return `Sertifikat_${slug}_${code}.pdf`;
}

export function groupCertificatesByEvent(items) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.event_id)) groups.set(item.event_id, { eventName: item.event_name, year: item.year, items: [] });
    groups.get(item.event_id).items.push(item);
  });
  return [...groups.values()];
}
