/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { EMAIL_PATTERN } from './athleteFormModel';

export function useAthleteEmailValidation({ email, isOpen, athleteId, checkAvailability = true }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const checkRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    checkRef.current?.abort();
    checkRef.current = null;
    const requestId = ++requestIdRef.current;
    const trimmedEmail = email?.trim();

    if (!isOpen || !trimmedEmail) {
      setStatus('idle');
      setMessage('');
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setStatus('invalid');
      setMessage('Format email tidak valid');
      return;
    }
    if (!checkAvailability) {
      setStatus('valid');
      setMessage('Format email valid');
      return;
    }

    const controller = new AbortController();
    checkRef.current = controller;
    setStatus('checking');
    setMessage('Memeriksa email...');

    const timer = setTimeout(async () => {
      try {
        const params = { email: trimmedEmail };
        if (athleteId) params.athlete_id = athleteId;
        const response = await api.get('/api/athletes/check-email', {
          params,
          signal: controller.signal
        });
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;
        if (response.data.available) {
          setStatus('valid');
          setMessage('Email tersedia');
        } else {
          setStatus('invalid');
          setMessage('Email sudah terdaftar');
        }
      } catch (error) {
        if (
          error.name === 'CanceledError' ||
          error.code === 'ERR_CANCELED' ||
          controller.signal.aborted ||
          requestIdRef.current !== requestId
        ) {
          return;
        }
        setStatus('error');
        setMessage('Gagal memeriksa email, coba lagi');
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [athleteId, checkAvailability, email, isOpen]);

  return {
    status,
    message,
    setStatus,
    setMessage,
    abort: () => {
      checkRef.current?.abort();
      requestIdRef.current += 1;
    }
  };
}
