import { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';

export function TurnstileWidget({ onTokenChange, onError }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const tokenCallbackRef = useRef(onTokenChange);
  const errorCallbackRef = useRef(onError);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    tokenCallbackRef.current = onTokenChange;
    errorCallbackRef.current = onError;
  }, [onError, onTokenChange]);

  useEffect(() => {
    if (!siteKey) {
      errorCallbackRef.current?.('Verifikasi keamanan belum dikonfigurasi.');
      return undefined;
    }

    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile || widgetRef.current !== null) {
        return;
      }
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action: 'account_email_recovery_lookup',
        callback: (token) => tokenCallbackRef.current?.(token),
        'expired-callback': () => tokenCallbackRef.current?.(''),
        'error-callback': () => {
          tokenCallbackRef.current?.('');
          errorCallbackRef.current?.('Verifikasi keamanan gagal dimuat. Silakan coba lagi.');
        },
      });
    };

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderWidget);
    renderWidget();

    return () => {
      cancelled = true;
      script?.removeEventListener('load', renderWidget);
      if (widgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
      }
      widgetRef.current = null;
    };
  }, [siteKey]);

  return <div ref={containerRef} className="min-h-[65px]" aria-label="Verifikasi keamanan Cloudflare Turnstile" />;
}