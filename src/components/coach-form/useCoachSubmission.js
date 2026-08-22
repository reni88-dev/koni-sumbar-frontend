import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { firstFieldError, normalizeValidationErrors } from '../form-modal/formUtils';
import { normalizeIndonesianMobile } from '../form-modal/phoneUtils';
import {
  buildCoachFormData,
  EMAIL_PATTERN,
  getCoachErrorStep,
  IDENTITY_PATTERN
} from './coachFormModel';

export function useCoachSubmission({
  coach,
  formData,
  achievementsList,
  files,
  phoneValidation,
  setErrors,
  setErrorMessage,
  setStep,
  scrollToTop,
  onSuccess
}) {
  const submitRequestIdRef = useRef(0);
  const submitControllerRef = useRef(null);
  const submitInFlightRef = useRef(false);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => cancelPending, [cancelPending]);

  const handleSubmit = async () => {
    if (submitInFlightRef.current || loading || files.isAnyFileProcessing) return;

    const step1Errors = {};
    if (!formData.name.trim()) step1Errors.name = ['Nama lengkap wajib diisi'];
    if (!formData.cabor_id) step1Errors.cabor_id = ['Cabang olahraga wajib dipilih'];
    if (!formData.province.trim()) step1Errors.province = ['Provinsi wajib dipilih'];
    if (!formData.city.trim()) step1Errors.city = ['Kota/Kabupaten wajib dipilih'];
    if (!formData.district.trim()) step1Errors.district = ['Kecamatan/Distrik wajib dipilih'];
    if (!formData.village.trim()) step1Errors.village = ['Kelurahan/Desa wajib dipilih'];
    if (formData.nik && !IDENTITY_PATTERN.test(formData.nik)) {
      step1Errors.nik = ['NIK harus tepat 16 digit angka'];
    }
    if (!files.identityDocumentFile && !files.canReuseStoredIdentity) {
      step1Errors.identity_document = [coach
        ? 'Data pelatih lama ini belum memiliki KTP. Unggah KTP sebelum menyimpan perubahan.'
        : 'KTP pelatih wajib diunggah.'];
    }
    if (!files.bpjsDocumentFile && !files.canReuseStoredBPJS) {
      step1Errors.bpjs_document = [coach
        ? 'Data pelatih lama ini belum memiliki dokumen BPJS. Unggah BPJS sebelum menyimpan perubahan.'
        : 'Dokumen BPJS pelatih wajib diunggah.'];
    }
    if (files.documentErrors.identity) {
      step1Errors.identity_document = [files.documentErrors.identity];
    }
    if (files.documentErrors.bpjs) {
      step1Errors.bpjs_document = [files.documentErrors.bpjs];
    }
    if (Object.keys(step1Errors).length > 0) {
      if (step1Errors.identity_document) {
        files.setDocumentError('identity', firstFieldError(step1Errors.identity_document));
      }
      if (step1Errors.bpjs_document) {
        files.setDocumentError('bpjs', firstFieldError(step1Errors.bpjs_document));
      }
      setErrors(step1Errors);
      setErrorMessage(firstFieldError(Object.values(step1Errors)[0]));
      setStep(1);
      scrollToTop();
      return;
    }

    const normalizedPhone = formData.phone ? normalizeIndonesianMobile(formData.phone) : '';
    const step2Errors = {};
    if (formData.phone?.trim()) {
      if (!normalizedPhone) {
        step2Errors.phone = ['Format nomor WhatsApp tidak valid'];
      } else if (phoneValidation.status !== 'valid') {
        step2Errors.phone = [phoneValidation.message || 'Nomor WhatsApp harus valid sebelum menyimpan data'];
      }
    }
    if (formData.email?.trim() && !EMAIL_PATTERN.test(formData.email.trim())) {
      step2Errors.email = ['Format alamat email tidak valid'];
    }
    if (Object.keys(step2Errors).length > 0) {
      setErrors(step2Errors);
      setErrorMessage(firstFieldError(Object.values(step2Errors)[0]));
      setStep(2);
      scrollToTop();
      return;
    }

    if (!files.certificateFile && !files.canReuseStoredCertificate) {
      const message = files.certificateError || (coach
        ? 'Data pelatih lama ini belum memiliki sertifikat. Unggah sertifikat sebelum menyimpan perubahan.'
        : 'Sertifikat pelatih wajib diunggah.');
      files.setCertificateError(message);
      setErrors({ certificate_document: [message] });
      setErrorMessage(message);
      setStep(3);
      scrollToTop();
      return;
    }

    submitInFlightRef.current = true;
    const requestId = ++submitRequestIdRef.current;
    const controller = new AbortController();
    submitControllerRef.current = controller;
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = buildCoachFormData(formData, achievementsList, files, normalizedPhone);
      if (coach) {
        await api.put(`/api/coaches/${coach.id}`, data, { signal: controller.signal });
      } else {
        await api.post('/api/coaches', data, { signal: controller.signal });
      }
      if (requestId === submitRequestIdRef.current && !controller.signal.aborted) {
        onSuccess();
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
        setErrors(validationErrors);
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
        const messages = Object.values(validationErrors).flat();
        setErrorMessage(messages.length > 0 ? messages[0] : 'Terjadi kesalahan validasi data');
        setStep(getCoachErrorStep(Object.keys(validationErrors)));
        scrollToTop();
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
