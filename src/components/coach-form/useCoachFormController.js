/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCoachPhotoUrl } from '../../lib/coachPhoto';
import { normalizeValidationErrors } from '../form-modal/formUtils';
import {
  filterValidationErrorsByStep,
  focusValidationField,
  getStepErrorCounts,
  orderedValidationEntries,
  replaceStepValidationErrors,
} from '../form-validation/profileValidation';
import { useValidatedPhoneField } from '../form-modal/useValidatedPhoneField';
import {
  createInitialCoachFormData,
  IDENTITY_PATTERN,
  mapCoachToForm,
} from './coachFormModel';
import {
  COACH_PROFILE_FIELDS,
  validateCoachProfile,
} from './coachProfileValidation';
import { useCoachLookups } from './useCoachLookups';
import { useCoachMedia } from './useCoachMedia';
import { useCoachSubmission } from './useCoachSubmission';

export function useCoachFormController({
  isOpen,
  coach,
  onSuccess,
  mode = 'admin',
  submitRequest,
}) {
  const formContainerRef = useRef(null);
  const validationSummaryRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(createInitialCoachFormData);
  const [achievementsList, setAchievementsList] = useState(['', '', '']);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [initialIncompleteCount, setInitialIncompleteCount] = useState(0);
  const [initialPhoneValue, setInitialPhoneValue] = useState('');

  const updateField = useCallback((field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setErrorMessage('');
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
    onNormalize: normalizePhone,
  });

  const validateProfile = useCallback(() => validateCoachProfile(formData, {
    isEdit: Boolean(coach),
    identityDocumentFile: media.identityDocumentFile,
    canReuseStoredIdentity: media.canReuseStoredIdentity,
    documentErrors: media.documentErrors,
    phoneStatus: phoneValidation.status,
    phoneMessage: phoneValidation.message,
    certificateError: media.certificateError,
  }), [
    coach,
    formData,
    media.canReuseStoredIdentity,
    media.certificateError,
    media.documentErrors,
    media.identityDocumentFile,
    phoneValidation.message,
    phoneValidation.status,
  ]);

  const navigateToError = useCallback((field) => focusValidationField({
    field,
    metadata: COACH_PROFILE_FIELDS,
    rootRef: formContainerRef,
    summaryRef: validationSummaryRef,
    onStepChange: mode === 'admin' ? setStep : undefined,
  }), [mode]);

  const presentErrors = useCallback(async (rawErrors, { focus = true } = {}) => {
    const nextErrors = normalizeValidationErrors(rawErrors || {});
    const entries = orderedValidationEntries(nextErrors, COACH_PROFILE_FIELDS);
    setErrors(nextErrors);
    setErrorMessage(entries.length > 0 ? `${entries.length} field perlu diperbaiki.` : '');
    if (focus && entries.length > 0) {
      await navigateToError(entries[0].field);
    }
    return nextErrors;
  }, [navigateToError]);

  const submission = useCoachSubmission({
    coach,
    formData,
    achievementsList,
    files: media,
    phoneValidation,
    validateProfile,
    presentErrors,
    setErrors,
    setErrorMessage,
    onSuccess,
    mode,
    submitRequest,
  });

  const { fetchLookups } = lookups;
  const { cancelPending: cancelMedia, reset: resetMedia } = media;
  const { cancelPending: cancelSubmission, reset: resetSubmission } = submission;

  useEffect(() => {
    resetMedia(isOpen && coach ? getCoachPhotoUrl(coach) : null);
    resetSubmission();
    setErrors({});
    setErrorMessage('');
    setInitialIncompleteCount(0);

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
      setInitialIncompleteCount(Object.keys(validateCoachProfile(mapped.formData, {
        isEdit: true,
        canReuseStoredIdentity: Boolean(coach.identity_document),
        phoneStatus: mapped.formData.phone ? 'valid' : undefined,
      })).length);
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
    resetSubmission,
  ]);

  const handleAchievementChange = useCallback((index, value) => {
    setAchievementsList((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
    setErrors((previous) => {
      if (!previous.achievements) return previous;
      const next = { ...previous };
      delete next.achievements;
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

  const isStepValid = () => Object.keys(
    filterValidationErrorsByStep(validateProfile(), COACH_PROFILE_FIELDS, step),
  ).length === 0 && !media.isAnyFileProcessing;

  const goToNextStep = async () => {
    if (media.isAnyFileProcessing || step >= 3) return;
    const stepErrors = filterValidationErrorsByStep(
      validateProfile(),
      COACH_PROFILE_FIELDS,
      step,
    );
    if (Object.keys(stepErrors).length > 0) {
      const merged = replaceStepValidationErrors(errors, stepErrors, COACH_PROFILE_FIELDS, step);
      setErrors(merged);
      setErrorMessage(`${Object.keys(stepErrors).length} field pada langkah ini perlu diperbaiki.`);
      const first = orderedValidationEntries(stepErrors, COACH_PROFILE_FIELDS)[0];
      if (first) await navigateToError(first.field);
      return;
    }
    setErrors((previous) => replaceStepValidationErrors(previous, {}, COACH_PROFILE_FIELDS, step));
    setErrorMessage('');
    setStep((current) => Math.min(current + 1, 3));
    formContainerRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const goToPrevStep = () => {
    if (step > 1) {
      setStep((current) => current - 1);
      formContainerRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    formContainerRef,
    validationSummaryRef,
    form: {
      data: formData,
      updateField,
      achievementsList,
      handleAchievementChange,
      handleAddAchievement,
      handleRemoveAchievement,
    },
    lookups,
    files: media,
    validation: {
      errors,
      errorMessage,
      metadata: COACH_PROFILE_FIELDS,
      navigateToError,
      stepErrorCounts: getStepErrorCounts(errors, COACH_PROFILE_FIELDS),
      initialIncompleteCount,
      phone: phoneValidation,
      nikInvalid: Boolean(errors.nik) || (formData.nik !== '' && !IDENTITY_PATTERN.test(formData.nik)),
    },
    navigation: {
      step,
      setStep,
      goToNextStep,
      goToPrevStep,
      currentStepValid: isStepValid(),
      navigateToError,
    },
    submission,
  };
}
