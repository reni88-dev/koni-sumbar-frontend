import { useRef, useState } from 'react';
import api from '../../api/axios';
import {
  isAccountBlockedError,
  isPermissionDeniedError,
  isSessionInvalidError,
} from '../../lib/authAccess';
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
  onSuccess,
  mode = 'admin',
  submitRequest
}) {
  const [loading, setLoading] = useState(false);
  const submissionInFlightRef = useRef(false);

  const handleSubmit = async () => {
    if (submissionInFlightRef.current || loading || files.isAnyFileProcessing) return;

    const identityErrors = getDocumentValidationErrors({
      formData,
      athlete,
      identityDocumentFile: files.identityDocumentFile,
      documentErrors: files.documentErrors
    });
    if (!formData.name.trim()) identityErrors.name = ['Nama lengkap wajib diisi'];
    if (!IDENTITY_PATTERN.test(formData.nik)) {
      identityErrors.nik = ['NIK harus tepat 16 digit angka'];
    }
    if (!IDENTITY_PATTERN.test(formData.no_kk)) {
      identityErrors.no_kk = ['No. KK harus tepat 16 digit angka'];
    }
    if (!formData.birth_place.trim()) identityErrors.birth_place = ['Tempat lahir wajib diisi'];
    if (!formData.gender) identityErrors.gender = ['Jenis kelamin wajib dipilih'];
    if (!formData.religion) identityErrors.religion = ['Agama wajib dipilih'];
    if (!formData.address.trim()) identityErrors.address = ['Alamat domisili wajib diisi'];
    if (!formData.cabor_id) identityErrors.cabor_id = ['Cabang olahraga wajib dipilih'];
    if (!formData.organization_id) identityErrors.organization_id = ['Organisasi/Pengcab wajib dipilih'];
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
    if (!formData.height) contactErrors.height = ['Tinggi badan wajib diisi'];
    if (!formData.weight) contactErrors.weight = ['Berat badan wajib diisi'];
    if (!formData.blood_type) contactErrors.blood_type = ['Golongan darah wajib dipilih'];
    if (!formData.education_level_id) contactErrors.education_level_id = ['Pendidikan terakhir wajib dipilih'];
    if (!formData.occupation.trim()) contactErrors.occupation = ['Pekerjaan wajib diisi'];
    if (!formData.marital_status) contactErrors.marital_status = ['Status perkawinan wajib dipilih'];
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

    const careerErrors = {};
    if (!formData.career_start_year) {
      careerErrors.career_start_year = ['Tahun mulai karir wajib diisi'];
    }
    if (Object.keys(careerErrors).length > 0) {
      setErrors(careerErrors);
      setErrorMessage(firstFieldError(Object.values(careerErrors)[0]));
      setStep(3);
      scrollToTop();
      return;
    }

    const parentPhoneErrors = {};
    if (!formData.father_name.trim()) {
      parentPhoneErrors.father_name = ['Nama ayah/wali wajib diisi'];
    }
    if (!formData.mother_name.trim()) {
      parentPhoneErrors.mother_name = ['Nama ibu/wali wajib diisi'];
    }
    if (!formData.parent_address.trim()) {
      parentPhoneErrors.parent_address = ['Alamat orang tua/wali wajib diisi'];
    }
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
    submissionInFlightRef.current = true;
    setLoading(true);
    setErrors({});
    setErrorMessage('');

    try {
      const data = buildAthleteFormData(submissionData, files, {
        excludedFields: mode === 'portal' ? ['is_active'] : [],
        includeEmptyFields: mode === 'portal'
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
      } else if (
        !isPermissionDeniedError(error) &&
        !isSessionInvalidError(error) &&
        !isAccountBlockedError(error)
      ) {
        setErrorMessage(error.response?.data?.error || error.response?.data?.message || 'Terjadi kesalahan server');
        scrollToTop();
      }
    } finally {
      submissionInFlightRef.current = false;
      setLoading(false);
    }
  };

  return { loading, setLoading, handleSubmit };
}
