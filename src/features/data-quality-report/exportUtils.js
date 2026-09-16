function safeFilename(value) {
  const filename = Array.from(String(value || '').split(/[\\/]/).pop())
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim();
  return filename || '';
}

export function getFilenameFromContentDisposition(header, fallback) {
  const value = String(header || '');
  const encodedMatch = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (encodedMatch) {
    try {
      const decoded = safeFilename(decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, '')));
      if (decoded) return decoded;
    } catch {
      // Fall through to the regular filename form.
    }
  }
  const quotedMatch = value.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch) {
    const filename = safeFilename(quotedMatch[1]);
    if (filename) return filename;
  }
  const plainMatch = value.match(/filename\s*=\s*([^;]+)/i);
  if (plainMatch) {
    const filename = safeFilename(plainMatch[1].replace(/^"|"$/g, ''));
    if (filename) return filename;
  }
  return safeFilename(fallback) || 'laporan-kualitas-data';
}

export function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}