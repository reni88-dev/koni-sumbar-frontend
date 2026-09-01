import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { firstFieldError, normalizeValidationErrors } from '../form-modal/formUtils';
import { normalizeIndonesianMobile } from '../form-modal/phoneUtils';
import { buildCoachFormData } from './coachFormModel';

export function useCoachSubmission({
  coach,
  formData,
  achievementsList,
  files,
  phoneValidation,
  validateProfile,
  presentErrors,
  setErrors,
  setErrorMessage,
  onSuccess,
  mode = 'admin',
  submitRequest,
}) {
  const [loading, setLoading] = useState(false);
  const submitInFlightRef = useRef(false);
  const submitRequestIdRef = useRef(0);
  const submitControllerRef = useRef(null);

  const cancelPending = useCallback(() => {
    submitRequestIdRef.current += 1;
    submitControllerRef.current?.abort();
    submitControllerRef.current = null;
    submitInFlightRef.current = false;
  }, []);

  const reset = useCallback(() => {
    cancelPending();
    setLoading(false);
  }, [cancelPending]);

  useEffect(() => () => cancelPending(), [cancelPending]);

  const handleSubmit = async () => {
    if (submitInFlightRef.current || loading || files.isAnyFileProcessing) return;

    const clientErrors = validateProfile();
    if (Object.keys(clientErrors).length > 0) {
      await presentErrors(clientErrors);
      return;
    }

    const normalizedPhone = formData.phone ? normalizeIndonesianMobile(formData.phone) : '';
    submitInFlightRef.current = true;
    const requestId = ++submitRequestIdRef.current;
    const controller = new AbortController();
    submitControllerRef.current = controller;
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = buildCoachFormData(formData, achievementsList, files, normalizedPhone, {
        excludedFields: mode === 'portal' ? ['is_active'] : [],
        includeEmptyFields: mode === 'portal',
      });
      if (submitRequest) {
        await submitRequest(data);
      } else if (coach) {
        await api.put(`/api/coaches/${coach.id}`, data, { signal: controller.signal });
      } else {
        await api.post('/api/coaches', data, { signal: controller.signal });
      }
      if (requestId === submitRequestIdRef.current && !controller.signal.aborted) {
        onSuccess?.();
      }
    } catch (error) {
      if (
        requestId !== submitRequestIdRef.current ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }

      if (error.response?.status === 422) {
        const validationErrors = normalizeValidationErrors(error.response.data.errors || {});
        if (validationErrors.phone) {
          phoneValidation.setStatus('invalid');
          phoneValidation.setMessage(firstFieldError(validationErrors.phone));
        }
        if (validationErrors.certificate_document) {
          files.setCertificateError(firstFieldError(validationErrors.certificate_document));
        }
        if (validationErrors.identity_document) {
          files.setDocumentError('identity', firstFieldError(validationErrors.identity_document));
        }
        if (validationErrors.bpjs_document) {
          files.setDocumentError('bpjs', firstFieldError(validationErrors.bpjs_document));
        }
        await presentErrors(validationErrors);
      } else if (error.response?.status === 409) {
        setErrorMessage('Data pelatih sudah terdaftar. Periksa kembali email atau NIK.');
      } else {
        setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan server');
      }
    } finally {
      if (requestId === submitRequestIdRef.current) {
        submitControllerRef.current = null;
        submitInFlightRef.current = false;
        setLoading(false);
      }
    }
  };

  return { loading, reset, cancelPending, handleSubmit };
}
