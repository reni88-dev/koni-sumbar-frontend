/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useValidatedPhoneField } from '../form-modal/useValidatedPhoneField';
import {
  createInitialAthleteFormData,
  getAthleteAgeGroup,
  getDocumentValidationErrors,
  IDENTITY_PATTERN,
  isIdentityTypeValidForAge,
  mapAthleteToForm
} from './athleteFormModel';
import { useAthleteEmailValidation } from './useAthleteEmailValidation';
import { useAthleteLookups } from './useAthleteLookups';
import { useAthleteMedia } from './useAthleteMedia';
import { useAthleteSubmission } from './useAthleteSubmission';

export function useAthleteFormController({
  isOpen,
  athlete,
  onSuccess,
  mode = 'admin',
  submitRequest
}) {
  const formContainerRef = useRef(null);
  const lastValidAgeGroupRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(createInitialAthleteFormData);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [initialPhoneValues, setInitialPhoneValues] = useState({
    phone: '',
    father_phone: '',
    mother_phone: ''
  });

  const updateField = useCallback((field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const normalizePhone = useCallback((value) => {
    setFormData((previous) => ({ ...previous, phone: value }));
  }, []);
  const normalizeFatherPhone = useCallback((value) => {
    setFormData((previous) => ({ ...previous, father_phone: value }));
  }, []);
  const normalizeMotherPhone = useCallback((value) => {
    setFormData((previous) => ({ ...previous, mother_phone: value }));
  }, []);

  const lookups = useAthleteLookups();
  const media = useAthleteMedia({ athlete, setErrors, setErrorMessage });
  const phoneValidation = useValidatedPhoneField({
    value: formData.phone,
    isOpen,
    recordId: athlete?.id,
    initialValue: initialPhoneValues.phone,
    onNormalize: normalizePhone
  });
  const fatherPhoneValidation = useValidatedPhoneField({
    value: formData.father_phone,
    isOpen,
    recordId: athlete?.id,
    initialValue: initialPhoneValues.father_phone,
    onNormalize: normalizeFatherPhone
  });
  const motherPhoneValidation = useValidatedPhoneField({
    value: formData.mother_phone,
    isOpen,
    recordId: athlete?.id,
    initialValue: initialPhoneValues.mother_phone,
    onNormalize: normalizeMotherPhone
  });
  const emailValidation = useAthleteEmailValidation({
    email: formData.email,
    isOpen,
    athleteId: athlete?.id,
    checkAvailability: mode !== 'portal'
  });

  const scrollToTop = useCallback(() => {
    setTimeout(() => {
      const container = formContainerRef.current;
      if (!container) return;
      if (container.scrollHeight > container.clientHeight) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }, []);

  const submission = useAthleteSubmission({
    athlete,
    formData,
    files: media,
    phoneValidation,
    fatherPhoneValidation,
    motherPhoneValidation,
    emailValidation,
    setErrors,
    setErrorMessage,
    setStep,
    scrollToTop,
    onSuccess,
    mode,
    submitRequest
  });

  const {
    clearCompetitionClasses,
    fetchBaseLookups,
    fetchCompetitionClasses
  } = lookups;
  const { reset: resetMedia } = media;
  const { setLoading } = submission;

  useEffect(() => {
    resetMedia(isOpen && athlete ? athlete.photo || null : null);
    setLoading(false);
    setErrors({});
    setErrorMessage('');

    if (!isOpen) {
      lastValidAgeGroupRef.current = null;
      return;
    }

    fetchBaseLookups();
    setStep(1);
    if (athlete) {
      const mapped = mapAthleteToForm(athlete);
      lastValidAgeGroupRef.current = mapped.ageGroup;
      setInitialPhoneValues(mapped.phoneValues);
      setFormData(mapped.formData);
      if (athlete.cabor_id) {
        fetchCompetitionClasses(athlete.cabor_id);
      }
    } else {
      lastValidAgeGroupRef.current = null;
      setInitialPhoneValues({ phone: '', father_phone: '', mother_phone: '' });
      clearCompetitionClasses();
      setFormData(createInitialAthleteFormData());
    }
  }, [
    athlete,
    clearCompetitionClasses,
    fetchBaseLookups,
    fetchCompetitionClasses,
    isOpen,
    resetMedia,
    setLoading
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const ageGroup = getAthleteAgeGroup(formData.birth_date);
    setFormData((previous) => {
      if (ageGroup === 'adult' && previous.identity_document_type !== 'ktp') {
        return { ...previous, identity_document_type: 'ktp' };
      }
      if (ageGroup === 'minor' && previous.identity_document_type === 'ktp') {
        return { ...previous, identity_document_type: '' };
      }
      return previous;
    });
  }, [formData.birth_date, isOpen]);

  const handleCaborChange = useCallback((caborId) => {
    setFormData((previous) => ({
      ...previous,
      cabor_id: caborId,
      competition_class_id: ''
    }));
    if (athlete) {
      fetchCompetitionClasses(caborId);
    } else {
      clearCompetitionClasses();
    }
  }, [athlete, clearCompetitionClasses, fetchCompetitionClasses]);

  const handleBirthDateChange = useCallback((value) => {
    const previousAgeGroup = getAthleteAgeGroup(formData.birth_date) || lastValidAgeGroupRef.current;
    const nextAgeGroup = getAthleteAgeGroup(value);
    if (previousAgeGroup && nextAgeGroup && previousAgeGroup !== nextAgeGroup) {
      media.invalidateIdentityForAgeChange();
    }
    if (nextAgeGroup) {
      lastValidAgeGroupRef.current = nextAgeGroup;
    }
    updateField('birth_date', value);
  }, [formData.birth_date, media, updateField]);

  const updateAchievement = useCallback((index, value) => {
    setFormData((previous) => {
      const achievements = [...previous.top_achievements];
      achievements[index] = value;
      return { ...previous, top_achievements: achievements };
    });
  }, []);

  const ageGroup = getAthleteAgeGroup(formData.birth_date);
  const storedIdentityType = athlete?.identity_document_type || '';
  const canReuseStoredIdentity = Boolean(athlete?.identity_document) &&
    isIdentityTypeValidForAge(storedIdentityType, ageGroup) &&
    formData.identity_document_type === storedIdentityType;
  const canReuseStoredBPJS = Boolean(athlete?.bpjs_document);
  const documentValidationErrors = getDocumentValidationErrors({
    formData,
    athlete,
    identityDocumentFile: media.identityDocumentFile,
    documentErrors: media.documentErrors
  });

  const isStepValid = () => {
    if (step === 1) {
      return formData.name.trim() !== '' &&
        IDENTITY_PATTERN.test(formData.nik) &&
        IDENTITY_PATTERN.test(formData.no_kk) &&
        formData.birth_place.trim() !== '' &&
        formData.birth_date !== '' &&
        formData.gender !== '' &&
        formData.religion !== '' &&
        formData.cabor_id !== '' &&
        formData.address.trim() !== '' &&
        formData.province.trim() !== '' &&
        formData.city.trim() !== '' &&
        formData.district.trim() !== '' &&
        formData.village.trim() !== '' &&
        Object.keys(documentValidationErrors).length === 0 &&
        !media.isAnyFileProcessing;
    }
    if (step === 2) {
      return formData.height !== '' &&
        formData.weight !== '' &&
        formData.blood_type !== '' &&
        formData.education_level_id !== '' &&
        formData.occupation.trim() !== '' &&
        formData.marital_status !== '' &&
        formData.phone.trim() !== '' &&
        formData.email.trim() !== '' &&
        phoneValidation.status === 'valid' &&
        emailValidation.status === 'valid';
    }
    if (step === 3) return formData.career_start_year !== '';

    const fatherPhone = formData.father_phone.trim();
    const motherPhone = formData.mother_phone.trim();
    return formData.father_name.trim() !== '' &&
      formData.mother_name.trim() !== '' &&
      formData.parent_address.trim() !== '' &&
      (fatherPhone === '' || fatherPhoneValidation.status === 'valid') &&
      (motherPhone === '' || motherPhoneValidation.status === 'valid');
  };

  const goToNextStep = () => {
    if (isStepValid() && step < 4) {
      setStep(step + 1);
      scrollToTop();
    }
  };
  const goToPrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      scrollToTop();
    }
  };

  return {
    formContainerRef,
    form: {
      data: formData,
      updateField,
      updateAchievement,
      handleCaborChange,
      handleBirthDateChange
    },
    lookups,
    files: media,
    validation: {
      errors,
      errorMessage,
      phone: phoneValidation,
      fatherPhone: fatherPhoneValidation,
      motherPhone: motherPhoneValidation,
      email: emailValidation,
      ageGroup,
      canReuseStoredIdentity,
      canReuseStoredBPJS,
      storedIdentityType,
      nikInvalid: Boolean(errors.nik) || (formData.nik !== '' && !IDENTITY_PATTERN.test(formData.nik)),
      noKKInvalid: Boolean(errors.no_kk) || (formData.no_kk !== '' && !IDENTITY_PATTERN.test(formData.no_kk))
    },
    navigation: {
      step,
      setStep,
      goToNextStep,
      goToPrevStep,
      currentStepValid: isStepValid()
    },
    submission
  };
}

