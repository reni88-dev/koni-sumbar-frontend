import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { compressImageToWebP, validateSourceFile } from '../form-modal/mediaUtils';

export function useCoachMedia({ coach, setErrors, setErrorMessage }) {
  const photoProcessingIdRef = useRef(0);
  const certificateProcessingIdRef = useRef(0);
  const certificateOpenRequestIdRef = useRef(0);
  const certificateOpenControllerRef = useRef(null);
  const certificatePreviewWindowRef = useRef(null);
  const certificateViewUrlRef = useRef('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateProcessing, setCertificateProcessing] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [certificateOpening, setCertificateOpening] = useState(false);

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  const cancelPending = useCallback(() => {
    photoProcessingIdRef.current += 1;
    certificateProcessingIdRef.current += 1;
    certificateOpenRequestIdRef.current += 1;
    certificateOpenControllerRef.current?.abort();
    certificateOpenControllerRef.current = null;
    certificatePreviewWindowRef.current?.close();
    certificatePreviewWindowRef.current = null;
  }, []);

  useEffect(() => () => {
    cancelPending();
    if (certificateViewUrlRef.current) {
      URL.revokeObjectURL(certificateViewUrlRef.current);
      certificateViewUrlRef.current = '';
    }
  }, [cancelPending]);

  const reset = useCallback((preview = null) => {
    cancelPending();
    setPhotoFile(null);
    setPhotoPreview(preview);
    setPhotoProcessing(false);
    setCertificateFile(null);
    setCertificateProcessing(false);
    setCertificateError('');
    setCertificateOpening(false);
  }, [cancelPending]);

  const handlePhotoChange = useCallback(async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhotoFile(null);
    setPhotoPreview(coach?.photo || null);
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
  }, [coach?.photo, setErrorMessage]);

  const handleCertificateChange = useCallback(async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++certificateProcessingIdRef.current;
    setCertificateFile(null);
    setCertificateError('');
    setErrors((previous) => {
      const next = { ...previous };
      delete next.certificate_document;
      return next;
    });
    setCertificateProcessing(true);

    try {
      const { extension } = validateSourceFile(file, { allowPDF: true });
      const processedFile = extension === 'pdf'
        ? file
        : await compressImageToWebP(file, { maxLongest: 1600 });
      if (processingId !== certificateProcessingIdRef.current) return;
      setCertificateFile(processedFile);
    } catch (error) {
      if (processingId !== certificateProcessingIdRef.current) return;
      setCertificateError(error.message || 'Sertifikat gagal diproses. Silakan pilih file lain.');
    } finally {
      if (processingId === certificateProcessingIdRef.current) {
        setCertificateProcessing(false);
      }
    }
  }, [setErrors]);

  const handleOpenStoredCertificate = useCallback(async () => {
    if (!coach?.certificate_document || certificateOpening) return;

    const requestId = ++certificateOpenRequestIdRef.current;
    certificateOpenControllerRef.current?.abort();
    const controller = new AbortController();
    certificateOpenControllerRef.current = controller;

    const previewWindow = window.open('', '_blank');
    certificatePreviewWindowRef.current = previewWindow;
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = 'Memuat sertifikat...';
      previewWindow.document.body.textContent = 'Memuat sertifikat...';
    }
    setCertificateOpening(true);
    setCertificateError('');

    try {
      const response = await api.get(coach.certificate_document, {
        responseType: 'blob',
        signal: controller.signal
      });
      if (requestId !== certificateOpenRequestIdRef.current || controller.signal.aborted) {
        previewWindow?.close();
        return;
      }
      if (certificateViewUrlRef.current) {
        URL.revokeObjectURL(certificateViewUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(response.data);
      certificateViewUrlRef.current = objectUrl;
      if (previewWindow) {
        previewWindow.location.replace(objectUrl);
      } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      previewWindow?.close();
      if (
        requestId !== certificateOpenRequestIdRef.current ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }
      setCertificateError(error.response?.status === 404
        ? 'Sertifikat tersimpan tidak ditemukan.'
        : 'Gagal membuka sertifikat tersimpan.');
    } finally {
      if (requestId === certificateOpenRequestIdRef.current) {
        certificateOpenControllerRef.current = null;
        certificatePreviewWindowRef.current = null;
        setCertificateOpening(false);
      }
    }
  }, [certificateOpening, coach?.certificate_document]);

  return {
    photoFile,
    photoPreview,
    photoProcessing,
    certificateFile,
    certificateProcessing,
    certificateError,
    certificateOpening,
    canReuseStoredCertificate: Boolean(coach?.certificate_document),
    isAnyFileProcessing: photoProcessing || certificateProcessing,
    setCertificateError,
    reset,
    cancelPending,
    handlePhotoChange,
    handleCertificateChange,
    handleOpenStoredCertificate
  };
}
