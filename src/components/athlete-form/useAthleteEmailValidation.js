/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import {
  getSafeApiMessage,
  isAccessServiceUnavailableError,
  isAccountBlockedError,
  isNetworkError,
  isPermissionDeniedError,
  isServerError,
  isSessionInvalidError,
} from '../../lib/authAccess';
import { EMAIL_PATTERN } from './athleteFormModel';

export function useAthleteEmailValidation({ email, isOpen, athleteId, checkAvailability = true }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const checkRef = useRef(null);
  const requestIdRef = useRef(0);
  const retryImmediatelyRef = useRef(false);

  useEffect(() => {
    checkRef.current?.abort();
    checkRef.current = null;
    const requestId = ++requestIdRef.current;
    const trimmedEmail = email?.trim();
    const retryImmediately = retryImmediatelyRef.current;
    retryImmediatelyRef.current = false;

    setRetryable(false);
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
          signal: controller.signal,
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
        ) return;

        if (isSessionInvalidError(error) || isAccountBlockedError(error)) {
          setStatus('idle');
          setMessage('');
          return;
        }

        const emailValidationMessage = error.response?.data?.errors?.email?.[0];
        if (error.response?.status === 422 && typeof emailValidationMessage === 'string') {
          setStatus('invalid');
          setMessage(emailValidationMessage);
          return;
        }
        if (isPermissionDeniedError(error)) {
          setStatus('error');
          setMessage(
            athleteId
              ? 'Izin untuk mengubah data atlet tidak lagi tersedia.'
              : 'Izin untuk menambah data atlet tidak lagi tersedia.',
          );
          return;
        }
        if (isAccessServiceUnavailableError(error)) {
          setStatus('error');
          setMessage('Layanan pemeriksaan email sedang tidak tersedia. Silakan coba lagi.');
          setRetryable(true);
          return;
        }
        if (isNetworkError(error)) {
          setStatus('error');
          setMessage('Server tidak dapat dihubungi. Periksa koneksi Anda lalu coba lagi.');
          setRetryable(true);
          return;
        }

        setStatus('error');
        setMessage(getSafeApiMessage(error, 'Gagal memeriksa email. Silakan coba lagi.'));
        setRetryable(isServerError(error));
      }
    }, retryImmediately ? 0 : 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [athleteId, checkAvailability, email, isOpen, retryAttempt]);

  const retry = useCallback(() => {
    if (!retryable) return;
    retryImmediatelyRef.current = true;
    setRetryAttempt((attempt) => attempt + 1);
  }, [retryable]);

  return {
    status,
    message,
    retryable,
    retry,
    setStatus,
    setMessage,
    abort: () => {
      checkRef.current?.abort();
      requestIdRef.current += 1;
    },
  };
}
