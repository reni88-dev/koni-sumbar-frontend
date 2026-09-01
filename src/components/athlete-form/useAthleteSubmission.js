import { useRef, useState } from 'react';
import api from '../../api/axios';
import {
  isAccountBlockedError,
  isPermissionDeniedError,
  isSessionInvalidError,
} from '../../lib/authAccess';
import { firstFieldError, normalizeValidationErrors } from '../form-modal/formUtils';
import { normalizeIndonesianMobile } from '../form-modal/phoneUtils';
import { buildAthleteFormData } from './athleteFormModel';

export function useAthleteSubmission({
  athlete,
  formData,
  files,
  phoneValidation,
  fatherPhoneValidation,
  motherPhoneValidation,
  emailValidation,
  validateProfile,
  presentErrors,
  setErrors,
  setErrorMessage,
  onSuccess,
  mode = 'admin',
  submitRequest,
}) {
  const [loading, setLoading] = useState(false);
  const submissionInFlightRef = useRef(false);

  const handleSubmit = async () => {
    if (submissionInFlightRef.current || loading || files.isAnyFileProcessing) return;

    const clientErrors = validateProfile();
    if (Object.keys(clientErrors).length > 0) {
      await presentErrors(clientErrors);
      return;
    }

    const normalizedPhone = normalizeIndonesianMobile(formData.phone);
    const normalizedFatherPhone = normalizeIndonesianMobile(formData.father_phone);
    const normalizedMotherPhone = normalizeIndonesianMobile(formData.mother_phone);
    const submissionData = {
      ...formData,
      phone: normalizedPhone,
      father_phone: normalizedFatherPhone || '',
      mother_phone: normalizedMotherPhone || '',
    };

    submissionInFlightRef.current = true;
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = buildAthleteFormData(submissionData, files, {
        excludedFields: mode === 'portal' ? ['is_active'] : [],
        includeEmptyFields: mode === 'portal',
      });
      if (submitRequest) {
        await submitRequest(data);
      } else if (athlete) {
        data.append('_method', 'PUT');
        await api.post(`/api/athletes/${athlete.id}`, data);
      } else {
        await api.post('/api/athletes', data);
      }
      onSuccess?.();
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = normalizeValidationErrors(error.response.data.errors || {});
        if (validationErrors.email) {
          emailValidation.setStatus('invalid');
          emailValidation.setMessage(firstFieldError(validationErrors.email) || 'Email sudah terdaftar');
        }
        if (validationErrors.phone) {
          phoneValidation.setStatus('invalid');
          phoneValidation.setMessage(firstFieldError(validationErrors.phone) || 'Format nomor WhatsApp tidak valid');
        }
        if (validationErrors.father_phone) {
          fatherPhoneValidation.setStatus('invalid');
          fatherPhoneValidation.setMessage(firstFieldError(validationErrors.father_phone));
        }
        if (validationErrors.mother_phone) {
          motherPhoneValidation.setStatus('invalid');
          motherPhoneValidation.setMessage(firstFieldError(validationErrors.mother_phone));
        }
        await presentErrors(validationErrors);
      } else if (
        !isPermissionDeniedError(error) &&
        !isSessionInvalidError(error) &&
        !isAccountBlockedError(error)
      ) {
        setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan server');
      }
    } finally {
      submissionInFlightRef.current = false;
      setLoading(false);
    }
  };

  return { loading, setLoading, handleSubmit };
}
