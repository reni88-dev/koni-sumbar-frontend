/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useValidatedPhoneField } from '../form-modal/useValidatedPhoneField';
import { getCoachPhotoUrl } from '../../lib/coachPhoto';
import {
  createInitialCoachFormData,
  EMAIL_PATTERN,
  IDENTITY_PATTERN,
  mapCoachToForm
} from './coachFormModel';
import { useCoachLookups } from './useCoachLookups';
import { useCoachMedia } from './useCoachMedia';
import { useCoachSubmission } from './useCoachSubmission';

export function useCoachFormController({
  isOpen,
  coach,
  onSuccess,
  mode = 'admin',
  submitRequest
}) {
  const formContainerRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(createInitialCoachFormData);
  const [achievementsList, setAchievementsList] = useState(['', '', '']);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [initialPhoneValue, setInitialPhoneValue] = useState('');

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

  const lookups = useCoachLookups();
  const media = useCoachMedia({ coach, setErrors, setErrorMessage });
  const phoneValidation = useValidatedPhoneField({
    value: formData.phone,
    isOpen,
    recordId: coach?.id,
    initialValue: initialPhoneValue,
    onNormalize: normalizePhone
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

  const submission = useCoachSubmission({
    coach,
    formData,
    achievementsList,
    files: media,
    phoneValidation,
    setErrors,
    setErrorMessage,
    setStep,
    scrollToTop,
    onSuccess,
    mode,
    submitRequest
  });

  const { fetchLookups } = lookups;
  const { cancelPending: cancelMedia, reset: resetMedia } = media;
  const { cancelPending: cancelSubmission, reset: resetSubmission } = submission;

  useEffect(() => {
    resetMedia(isOpen && coach ? getCoachPhotoUrl(coach) : null);
    resetSubmission();
    setErrors({});
    setErrorMessage('');

    if (!isOpen) {
      setFormData(createInitialCoachFormData());
      setAchievementsList(['', '', '']);
      setInitialPhoneValue('');
      return;
    }

    setStep(1);
    fetchLookups();
    if (coach) {
      const mapped = mapCoachToForm(coach);
      setInitialPhoneValue(mapped.savedPhone);
      setFormData(mapped.formData);
      setAchievementsList(mapped.achievements);
    } else {
      setInitialPhoneValue('');
      setFormData(createInitialCoachFormData());
      setAchievementsList(['', '', '']);
    }

    return () => {
      cancelMedia();
      cancelSubmission();
    };
  }, [
    cancelMedia,
    cancelSubmission,
    coach,
    fetchLookups,
    isOpen,
    resetMedia,
    resetSubmission
  ]);

  const handleAchievementChange = useCallback((index, value) => {
    setAchievementsList((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  }, []);
  const handleAddAchievement = useCallback(() => {
    setAchievementsList((previous) => [...previous, '']);
  }, []);
  const handleRemoveAchievement = useCallback((index) => {
    setAchievementsList((previous) => {
      if (previous.length <= 1) return [''];
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  }, []);

  const isStepValid = () => {
    if (step === 1) {
      const nikValid = IDENTITY_PATTERN.test(formData.nik);
      const hasIdentityDocument = Boolean(media.identityDocumentFile || media.canReuseStoredIdentity);
      return formData.name.trim() !== '' &&
        formData.cabor_id !== '' &&
        formData.province.trim() !== '' &&
        formData.city.trim() !== '' &&
        formData.district.trim() !== '' &&
        nikValid &&
        hasIdentityDocument &&
        !media.photoProcessing &&
        !media.documentProcessing.identity &&
        !media.documentProcessing.bpjs &&
        !media.documentErrors.identity &&
        !media.documentErrors.bpjs;
    }
    if (step === 2) {
      const phoneValid = !formData.phone?.trim() || phoneValidation.status === 'valid';
      const emailValid = !formData.email?.trim() || EMAIL_PATTERN.test(formData.email.trim());
      return phoneValid && emailValid;
    }
    if (step === 3) {
      return !media.certificateProcessing && !media.certificateError;
    }
    return true;
  };

  const goToNextStep = () => {
    if (isStepValid() && step < 3) {
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
      achievementsList,
      handleAchievementChange,
      handleAddAchievement,
      handleRemoveAchievement
    },
    lookups,
    files: media,
    validation: {
      errors,
      errorMessage,
      phone: phoneValidation,
      nikInvalid: Boolean(errors.nik) || (formData.nik !== '' && !IDENTITY_PATTERN.test(formData.nik))
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
