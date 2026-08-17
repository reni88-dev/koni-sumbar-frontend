/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import {
  checkWhatsAppPhone,
  isCanceledRequest,
  normalizeIndonesianMobile,
  PHONE_CHECK_SKIPPED_MESSAGE
} from './phoneUtils';

export function useValidatedPhoneField({
  value,
  isOpen,
  recordId,
  initialValue,
  onNormalize,
  debounceMs = 800
}) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const checkRef = useRef(null);
  const onNormalizeRef = useRef(onNormalize);

  useEffect(() => {
    onNormalizeRef.current = onNormalize;
  }, [onNormalize]);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setMessage('');
      return;
    }

    const phone = value?.trim();
    if (!phone) {
      setStatus('idle');
      setMessage('');
      return;
    }

    const normalized = normalizeIndonesianMobile(phone);
    if (!normalized) {
      setStatus('invalid');
      setMessage('Format nomor WhatsApp tidak valid');
      return;
    }
    if (normalized !== phone) {
      setStatus('checking');
      setMessage('Memeriksa nomor...');
      onNormalizeRef.current(normalized);
      return;
    }
    if (recordId && normalized === initialValue) {
      setStatus('valid');
      setMessage('Nomor tersimpan');
      return;
    }

    setStatus('checking');
    setMessage('Memeriksa nomor...');
    checkRef.current?.abort();
    const controller = new AbortController();
    checkRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const result = await checkWhatsAppPhone(normalized, controller.signal);
        if (controller.signal.aborted) return;
        setStatus(result.status);
        setMessage(result.message);
      } catch (error) {
        if (!isCanceledRequest(error)) {
          setStatus('valid');
          setMessage(PHONE_CHECK_SKIPPED_MESSAGE);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [debounceMs, initialValue, isOpen, recordId, value]);

  useEffect(() => () => checkRef.current?.abort(), []);

  return {
    status,
    message,
    setStatus,
    setMessage,
    abort: () => checkRef.current?.abort()
  };
}



