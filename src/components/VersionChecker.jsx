import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const normalizeAssetPath = (assetUrl) => {
  try {
    return new URL(assetUrl, window.location.href).pathname;
  } catch {
    return assetUrl;
  }
};

const getAssetSignature = (root) => {
  const moduleScripts = Array.from(root.querySelectorAll('script[type="module"][src]'))
    .map((script) => `script:${normalizeAssetPath(script.getAttribute('src'))}`);
  const stylesheets = Array.from(root.querySelectorAll('link[rel~="stylesheet"][href]'))
    .map((link) => `style:${normalizeAssetPath(link.getAttribute('href'))}`);

  return [...new Set([...moduleScripts, ...stylesheets])].sort().join('|');
};

/**
 * VersionChecker - Polls for new app versions in production.
 * Compares the assets running in the current document with the latest index.html.
 * If changed (new deploy), shows a non-intrusive update banner.
 */
export function VersionChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only run in production (skip during dev with HMR)
    if (import.meta.env.DEV) return;

    const activeSignature = getAssetSignature(document);
    const controller = new AbortController();
    let checkInProgress = false;

    const checkForUpdate = async () => {
      if (!activeSignature || checkInProgress) return;

      checkInProgress = true;

      try {
        const response = await fetch(`/index.html?_v=${Date.now()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) return;

        const html = await response.text();
        const latestDocument = new DOMParser().parseFromString(html, 'text/html');
        const latestSignature = getAssetSignature(latestDocument);

        if (latestSignature && latestSignature !== activeSignature) {
          setUpdateAvailable(true);
        }
      } catch {
        // A temporary network failure should not interrupt the application.
      } finally {
        checkInProgress = false;
      }
    };

    // Check immediately so an already-stale tab does not establish a server baseline.
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 30_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-900 text-white rounded-xl shadow-2xl shadow-black/30 border border-slate-700">
        <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
        <span className="text-sm font-medium">Versi baru tersedia!</span>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
