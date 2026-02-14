import { useState, useEffect, useRef } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * VersionChecker - Polls for new app versions in production.
 * Fetches /index.html every 30s and compares script/link references.
 * If changed (new deploy), shows a non-intrusive update banner.
 */
export function VersionChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const initialHash = useRef(null);

  useEffect(() => {
    // Only run in production (skip during dev with HMR)
    if (import.meta.env.DEV) return;

    const getPageHash = async () => {
      try {
        // Fetch index.html with cache-busting to always get the latest
        const res = await fetch(`/?_v=${Date.now()}`, { cache: 'no-store' });
        const html = await res.text();
        // Extract all script src and link href — these contain Vite's content hashes
        const assets = html.match(/(?:src|href)="[^"]*\.[a-f0-9]+\.\w+"/g);
        return assets ? assets.sort().join('|') : html.length.toString();
      } catch {
        return null;
      }
    };

    // Capture initial hash on first load
    const init = async () => {
      initialHash.current = await getPageHash();
    };
    init();

    // Poll every 30 seconds
    const interval = setInterval(async () => {
      if (dismissed) return;
      const currentHash = await getPageHash();
      if (currentHash && initialHash.current && currentHash !== initialHash.current) {
        setUpdateAvailable(true);
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [dismissed]);

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
