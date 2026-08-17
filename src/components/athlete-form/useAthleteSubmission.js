import { useState } from 'react';
import api from '../../api/axios';
import { firstFieldError, normalizeValidationErrors } from '../form-modal/formUtils';
import { normalizeIndonesianMobile } from '../form-modal/phoneUtils';
import {
  buildAthleteFormData,
  getAthleteErrorStep,
  getDocumentValidationErrors,
  IDENTITY_PATTERN
} from './athleteFormModel';

export function useAthleteSubmission({
  athlete,
  formData,
  files,
  phoneValidation,
  fatherPhoneValidation,
  motherPhoneValidation,
  emailValidation,
  setErrors,
  setErrorMessage,
  setStep,
  scrollToTop,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading || files.isAnyFileProcessing) return;

    const identityErrors = getDocumentValidationErrors({
      formData,
      athlete,
      identityDocumentFile: files.identityDocumentFile,
      bpjsDocumentFile: files.bpjsDocumentFile,
      documentErrors: files.documentErrors
    });
    if (!IDENTITY_PATTERN.test(formData.nik)) {
      identityErrors.nik = ['NIK harus tepat 16 digit angka'];
    }
    if (!IDENTITY_PATTERN.test(formData.no_kk)) {
      identityErrors.no_kk = ['No. KK harus tepat 16 digit angka'];
    }
    if (!formData.province.trim()) identityErrors.province = ['Provinsi wajib dipilih'];
    if (!formData.city.trim()) identityErrors.city = ['Kota/Kabupaten wajib dipilih'];
    if (!formData.district.trim()) identityErrors.district = ['Kecamatan/Distrik wajib dipilih'];
    if (!formData.village.trim()) identityErrors.village = ['Kelurahan/Desa wajib dipilih'];
    if (Object.keys(identityErrors).length > 0) {
      setErrors(identityErrors);
      setErrorMessage(firstFieldError(Object.values(identityErrors)[0]));
      setStep(1);
      scrollToTop();
      return;
    }

    const normalizedPhone = normalizeIndonesianMobile(formData.phone);
    const normalizedFatherPhone = normalizeIndonesianMobile(formData.father_phone);
    const normalizedMotherPhone = normalizeIndonesianMobile(formData.mother_phone);
    const contactErrors = {};
    if (!normalizedPhone) {
      contactErrors.phone = ['Format nomor WhatsApp tidak valid'];
    } else if (phoneValidation.status !== 'valid') {
      contactErrors.phone = [phoneValidation.message || 'Nomor WhatsApp harus valid sebelum menyimpan data'];
    }
    if (emailValidation.status !== 'valid') {
      contactErrors.email = [emailValidation.message || 'Email harus berhasil diperiksa sebelum menyimpan data'];
    }
    if (Object.keys(contactErrors).length > 0) {
      setErrors(contactErrors);
      setErrorMessage(firstFieldError(Object.values(contactErrors)[0]));
      setStep(2);
      scrollToTop();
      return;
    }

    const parentPhoneErrors = {};
    if (formData.father_phone.trim() && !normalizedFatherPhone) {
      parentPhoneErrors.father_phone = ['Format nomor WhatsApp tidak valid'];
    } else if (normalizedFatherPhone && fatherPhoneValidation.status !== 'valid') {
      parentPhoneErrors.father_phone = [fatherPhoneValidation.message || 'Nomor WhatsApp ayah/wali harus valid sebelum menyimpan data'];
    }
    if (formData.mother_phone.trim() && !normalizedMotherPhone) {
      parentPhoneErrors.mother_phone = ['Format nomor WhatsApp tidak valid'];
    } else if (normalizedMotherPhone && motherPhoneValidation.status !== 'valid') {
      parentPhoneErrors.mother_phone = [motherPhoneValidation.message || 'Nomor WhatsApp ibu/wali harus valid sebelum menyimpan data'];
    }
    if (!formData.father_phone.trim() && !formData.mother_phone.trim()) {
      parentPhoneErrors.father_phone = ['Minimal salah satu nomor WhatsApp orang tua/wali wajib diisi'];
    }
    if (Object.keys(parentPhoneErrors).length > 0) {
      setErrors(parentPhoneErrors);
      setErrorMessage(firstFieldError(Object.values(parentPhoneErrors)[0]));
      setStep(4);
      scrollToTop();
      return;
    }

    const submissionData = {
      ...formData,
      phone: normalizedPhone,
      father_phone: normalizedFatherPhone || '',
      mother_phone: normalizedMotherPhone || ''
    };
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = buildAthleteFormData(submissionData, files);
      if (athlete) {
        data.append('_method', 'PUT');
        await api.post(`/api/athletes/${athlete.id}`, data);
      } else {
        await api.post('/api/athletes', data);
      }
      onSuccess();
    } catch (error) {
      if (error.response?.status === 422) {
        const validationErrors = normalizeValidationErrors(error.response.data.errors || {});
        setErrors(validationErrors);
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
          fatherPhoneValidation.setMessage(firstFieldError(validationErrors.father_phone) || 'Format nomor WhatsApp tidak valid');
        }
        if (validationErrors.mother_phone) {
          motherPhoneValidation.setStatus('invalid');
          motherPhoneValidation.setMessage(firstFieldError(validationErrors.mother_phone) || 'Format nomor WhatsApp tidak valid');
        }
        const messages = Object.values(validationErrors).flat();
        setErrorMessage(messages.length > 0 ? messages[0] : 'Terjadi kesalahan validasi');
        setStep(getAthleteErrorStep(Object.keys(validationErrors)));
        scrollToTop();
      } else {
        setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan server');
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, setLoading, handleSubmit };
}
