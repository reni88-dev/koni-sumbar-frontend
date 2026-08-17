import { useCallback, useEffect, useRef, useState } from 'react';
import { compressImageToWebP, validateSourceFile } from '../form-modal/mediaUtils';
import { getAthleteAgeGroup } from './athleteFormModel';

export function useAthleteMedia({ athlete, setErrors, setErrorMessage }) {
  const photoProcessingIdRef = useRef(0);
  const identityProcessingIdRef = useRef(0);
  const bpjsProcessingIdRef = useRef(0);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [identityDocumentFile, setIdentityDocumentFile] = useState(null);
  const [bpjsDocumentFile, setBPJSDocumentFile] = useState(null);
  const [documentProcessing, setDocumentProcessing] = useState({ identity: false, bpjs: false });
  const [documentErrors, setDocumentErrors] = useState({ identity: '', bpjs: '' });

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  const reset = useCallback((preview = null) => {
    photoProcessingIdRef.current += 1;
    identityProcessingIdRef.current += 1;
    bpjsProcessingIdRef.current += 1;
    setPhotoFile(null);
    setPhotoPreview(preview);
    setPhotoProcessing(false);
    setIdentityDocumentFile(null);
    setBPJSDocumentFile(null);
    setDocumentProcessing({ identity: false, bpjs: false });
    setDocumentErrors({ identity: '', bpjs: '' });
  }, []);

  const invalidateIdentityForAgeChange = useCallback(() => {
    identityProcessingIdRef.current += 1;
    setIdentityDocumentFile(null);
    setDocumentProcessing((previous) => ({ ...previous, identity: false }));
    setDocumentErrors((previous) => ({
      ...previous,
      identity: 'Kelompok umur berubah. Unggah dokumen identitas pengganti yang sesuai.'
    }));
  }, []);

  const handlePhotoChange = useCallback(async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhotoFile(null);
    setPhotoPreview(athlete?.photo || null);
    setPhotoProcessing(true);
    setErrorMessage('');

    try {
      validateSourceFile(file, { allowPDF: false });
      const compressed = await compressImageToWebP(file, { maxWidth: 800 });
      if (processingId !== photoProcessingIdRef.current) return;
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (error) {
      if (processingId !== photoProcessingIdRef.current) return;
      setPhotoFile(null);
      setErrorMessage(error.message || 'Foto gagal diproses. Silakan pilih file lain.');
    } finally {
      if (processingId === photoProcessingIdRef.current) {
        setPhotoProcessing(false);
      }
    }
  }, [athlete?.photo, setErrorMessage]);

  const handleDocumentChange = useCallback((kind, birthDate) => async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (kind === 'identity' && !getAthleteAgeGroup(birthDate)) {
      setDocumentErrors((previous) => ({
        ...previous,
        identity: 'Isi tanggal lahir yang valid terlebih dahulu.'
      }));
      return;
    }

    const processingRef = kind === 'identity' ? identityProcessingIdRef : bpjsProcessingIdRef;
    const processingId = ++processingRef.current;
    if (kind === 'identity') {
      setIdentityDocumentFile(null);
    } else {
      setBPJSDocumentFile(null);
    }
    setDocumentErrors((previous) => ({ ...previous, [kind]: '' }));
    setDocumentProcessing((previous) => ({ ...previous, [kind]: true }));

    try {
      const { extension } = validateSourceFile(file, { allowPDF: true });
      const processedFile = extension === 'pdf'
        ? file
        : await compressImageToWebP(file, { maxLongest: 1600 });
      if (processingId !== processingRef.current) return;
      if (kind === 'identity') {
        setIdentityDocumentFile(processedFile);
        setErrors((previous) => {
          const next = { ...previous };
          delete next.identity_document;
          return next;
        });
      } else {
        setBPJSDocumentFile(processedFile);
        setErrors((previous) => {
          const next = { ...previous };
          delete next.bpjs_document;
          return next;
        });
      }
    } catch (error) {
      if (processingId !== processingRef.current) return;
      setDocumentErrors((previous) => ({
        ...previous,
        [kind]: error.message || 'Dokumen gagal diproses. Silakan pilih file lain.'
      }));
    } finally {
      if (processingId === processingRef.current) {
        setDocumentProcessing((previous) => ({ ...previous, [kind]: false }));
      }
    }
  }, [setErrors]);

  return {
    photoFile,
    photoPreview,
    photoProcessing,
    identityDocumentFile,
    bpjsDocumentFile,
    documentProcessing,
    documentErrors,
    isAnyFileProcessing: photoProcessing || documentProcessing.identity || documentProcessing.bpjs,
    reset,
    invalidateIdentityForAgeChange,
    handlePhotoChange,
    handleDocumentChange
  };
}
