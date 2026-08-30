/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';
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
  createInitialAthleteFormData,
  getAthleteAgeGroup,
  IDENTITY_PATTERN,
  isIdentityTypeValidForAge,
  mapAthleteToForm,
} from './athleteFormModel';
import {
  ATHLETE_PROFILE_FIELDS,
  canReuseAthleteStoredIdentity,
  validateAthleteProfile,
} from './athleteProfileValidation';
import { useAthleteEmailValidation } from './useAthleteEmailValidation';
import { useAthleteLookups } from './useAthleteLookups';
import { useAthleteMedia } from './useAthleteMedia';
import { useAthleteSubmission } from './useAthleteSubmission';

export function useAthleteFormController({
  isOpen,
  athlete,
  onSuccess,
  mode = 'admin',
  submitRequest,
}) {
  const formContainerRef = useRef(null);
  const validationSummaryRef = useRef(null);
  const lastValidAgeGroupRef = useRef(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(createInitialAthleteFormData);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [initialIncompleteCount, setInitialIncompleteCount] = useState(0);
  const [initialPhoneValues, setInitialPhoneValues] = useState({
    phone: '',
    father_phone: '',
    mother_phone: '',
  });

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
    onNormalize: normalizePhone,
  });
  const fatherPhoneValidation = useValidatedPhoneField({
    value: formData.father_phone,
    isOpen,
    recordId: athlete?.id,
    initialValue: initialPhoneValues.father_phone,
    onNormalize: normalizeFatherPhone,
  });
  const motherPhoneValidation = useValidatedPhoneField({
    value: formData.mother_phone,
    isOpen,
    recordId: athlete?.id,
    initialValue: initialPhoneValues.mother_phone,
    onNormalize: normalizeMotherPhone,
  });
  const emailValidation = useAthleteEmailValidation({
    email: formData.email,
    isOpen,
    athleteId: athlete?.id,
    checkAvailability: mode !== 'portal',
  });

  const validateProfile = useCallback(() => validateAthleteProfile(formData, {
    athlete,
    identityDocumentFile: media.identityDocumentFile,
    documentErrors: media.documentErrors,
    phoneStatus: phoneValidation.status,
    phoneMessage: phoneValidation.message,
    fatherPhoneStatus: fatherPhoneValidation.status,
    fatherPhoneMessage: fatherPhoneValidation.message,
    motherPhoneStatus: motherPhoneValidation.status,
    motherPhoneMessage: motherPhoneValidation.message,
    emailStatus: emailValidation.status,
    emailMessage: emailValidation.message,
  }), [
    athlete,
    emailValidation.message,
    emailValidation.status,
    fatherPhoneValidation.message,
    fatherPhoneValidation.status,
    formData,
    media.documentErrors,
    media.identityDocumentFile,
    motherPhoneValidation.message,
    motherPhoneValidation.status,
    phoneValidation.message,
    phoneValidation.status,
  ]);

  const navigateToError = useCallback((field) => focusValidationField({
    field,
    metadata: ATHLETE_PROFILE_FIELDS,
    rootRef: formContainerRef,
    summaryRef: validationSummaryRef,
    onStepChange: mode === 'admin' ? setStep : undefined,
  }), [mode]);

  const presentErrors = useCallback(async (rawErrors, { focus = true } = {}) => {
    const nextErrors = normalizeValidationErrors(rawErrors || {});
    const entries = orderedValidationEntries(nextErrors, ATHLETE_PROFILE_FIELDS);
    setErrors(nextErrors);
    setErrorMessage(entries.length > 0 ? `${entries.length} field perlu diperbaiki.` : '');
    if (focus && entries.length > 0) {
      await navigateToError(entries[0].field);
    }
    return nextErrors;
  }, [navigateToError]);

  const submission = useAthleteSubmission({
    athlete,
    formData,
    files: media,
    phoneValidation,
    fatherPhoneValidation,
    motherPhoneValidation,
    emailValidation,
    validateProfile,
    presentErrors,
    setErrors,
    setErrorMessage,
    onSuccess,
    mode,
    submitRequest,
  });

  const {
    clearCompetitionClasses,
    fetchBaseLookups,
    fetchCompetitionClasses,
  } = lookups;
  const { reset: resetMedia } = media;
  const { setLoading } = submission;

  useEffect(() => {
    resetMedia(isOpen && athlete ? athlete.photo || null : null);
    setLoading(false);
    setErrors({});
    setErrorMessage('');
    setInitialIncompleteCount(0);

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
      setInitialIncompleteCount(Object.keys(validateAthleteProfile(mapped.formData, {
        athlete,
        phoneStatus: 'valid',
        fatherPhoneStatus: mapped.formData.father_phone ? 'valid' : undefined,
        motherPhoneStatus: mapped.formData.mother_phone ? 'valid' : undefined,
        emailStatus: 'valid',
      })).length);
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
    setLoading,
  ]);

  const handleCaborChange = useCallback((caborId) => {
    setFormData((previous) => ({
      ...previous,
      cabor_id: caborId,
      competition_class_id: '',
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.cabor_id;
      delete next.competition_class_id;
      delete next.competition_class;
      return next;
    });
    if (athlete) fetchCompetitionClasses(caborId);
    else clearCompetitionClasses();
  }, [athlete, clearCompetitionClasses, fetchCompetitionClasses]);

  const handleBirthDateChange = useCallback((value) => {
    const previousAgeGroup = getAthleteAgeGroup(formData.birth_date) || lastValidAgeGroupRef.current;
    const nextAgeGroup = getAthleteAgeGroup(value);
    const ageGroupChanged = previousAgeGroup && nextAgeGroup && previousAgeGroup !== nextAgeGroup;
    if (ageGroupChanged) media.invalidateIdentityForAgeChange();
    if (nextAgeGroup) lastValidAgeGroupRef.current = nextAgeGroup;

    setFormData((previous) => ({
      ...previous,
      birth_date: value,
      identity_document_type: ageGroupChanged ||
        (nextAgeGroup && !isIdentityTypeValidForAge(previous.identity_document_type, nextAgeGroup))
        ? ''
        : previous.identity_document_type,
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.birth_date;
      delete next.identity_document_type;
      return next;
    });
    setErrorMessage('');
  }, [formData.birth_date, media]);

  const updateAchievement = useCallback((index, value) => {
    setFormData((previous) => {
      const achievements = [...previous.top_achievements];
      achievements[index] = value;
      return { ...previous, top_achievements: achievements };
    });
    setErrors((previous) => {
      if (!previous.top_achievements) return previous;
      const next = { ...previous };
      delete next.top_achievements;
      return next;
    });
    setErrorMessage('');
  }, []);

  const ageGroup = getAthleteAgeGroup(formData.birth_date);
  const storedIdentityType = athlete?.identity_document_type || '';
  const canReuseStoredIdentity = canReuseAthleteStoredIdentity({ athlete, formData });
  const canReuseStoredBPJS = Boolean(athlete?.bpjs_document);

  const isStepValid = () => Object.keys(
    filterValidationErrorsByStep(validateProfile(), ATHLETE_PROFILE_FIELDS, step),
  ).length === 0 && !media.isAnyFileProcessing;

  const goToNextStep = async () => {
    if (media.isAnyFileProcessing || step >= 4) return;
    const stepErrors = filterValidationErrorsByStep(
      validateProfile(),
      ATHLETE_PROFILE_FIELDS,
      step,
    );
    if (Object.keys(stepErrors).length > 0) {
      const merged = replaceStepValidationErrors(errors, stepErrors, ATHLETE_PROFILE_FIELDS, step);
      setErrors(merged);
      setErrorMessage(`${Object.keys(stepErrors).length} field pada langkah ini perlu diperbaiki.`);
      const first = orderedValidationEntries(stepErrors, ATHLETE_PROFILE_FIELDS)[0];
      if (first) await navigateToError(first.field);
      return;
    }
    setErrors((previous) => replaceStepValidationErrors(previous, {}, ATHLETE_PROFILE_FIELDS, step));
    setErrorMessage('');
    setStep((current) => Math.min(current + 1, 4));
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
      updateAchievement,
      handleCaborChange,
      handleBirthDateChange,
    },
    lookups,
    files: media,
    validation: {
      errors,
      errorMessage,
      metadata: ATHLETE_PROFILE_FIELDS,
      navigateToError,
      stepErrorCounts: getStepErrorCounts(errors, ATHLETE_PROFILE_FIELDS),
      initialIncompleteCount,
      phone: phoneValidation,
      fatherPhone: fatherPhoneValidation,
      motherPhone: motherPhoneValidation,
      email: emailValidation,
      ageGroup,
      canReuseStoredIdentity,
      canReuseStoredBPJS,
      storedIdentityType,
      nikInvalid: Boolean(errors.nik) || (formData.nik !== '' && !IDENTITY_PATTERN.test(formData.nik)),
      noKKInvalid: Boolean(errors.no_kk) || (formData.no_kk !== '' && !IDENTITY_PATTERN.test(formData.no_kk)),
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

