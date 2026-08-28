import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { getCoachPhotoUrl } from '../../lib/coachPhoto';
import { compressImageToWebP, validateSourceFile } from '../form-modal/mediaUtils';

export function useCoachMedia({ coach, setErrors, setErrorMessage }) {
  const photoProcessingIdRef = useRef(0);
  const certificateProcessingIdRef = useRef(0);
  const identityProcessingIdRef = useRef(0);
  const bpjsProcessingIdRef = useRef(0);
  const certificateOpenRequestIdRef = useRef(0);
  const certificateOpenControllerRef = useRef(null);
  const certificatePreviewWindowRef = useRef(null);
  const certificateViewUrlRef = useRef('');
  const documentOpenRequestIdsRef = useRef({ identity: 0, bpjs: 0 });
  const documentOpenControllersRef = useRef({});
  const documentPreviewWindowsRef = useRef({});
  const documentViewUrlsRef = useRef({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateProcessing, setCertificateProcessing] = useState(false);
  const [certificateError, setCertificateError] = useState('');
  const [certificateOpening, setCertificateOpening] = useState(false);
  const [identityDocumentFile, setIdentityDocumentFile] = useState(null);
  const [bpjsDocumentFile, setBPJSDocumentFile] = useState(null);
  const [documentProcessing, setDocumentProcessing] = useState({ identity: false, bpjs: false });
  const [documentOpening, setDocumentOpening] = useState({ identity: false, bpjs: false });
  const [documentErrors, setDocumentErrors] = useState({ identity: '', bpjs: '' });
  const coachPhotoUrl = getCoachPhotoUrl(coach);

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  const revokeCertificateViewUrl = useCallback(() => {
    if (certificateViewUrlRef.current) {
      URL.revokeObjectURL(certificateViewUrlRef.current);
      certificateViewUrlRef.current = '';
    }
  }, []);

  const revokeDocumentViewUrls = useCallback(() => {
    Object.values(documentViewUrlsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    documentViewUrlsRef.current = {};
  }, []);

  const cancelPending = useCallback(() => {
    photoProcessingIdRef.current += 1;
    certificateProcessingIdRef.current += 1;
    identityProcessingIdRef.current += 1;
    bpjsProcessingIdRef.current += 1;
    certificateOpenRequestIdRef.current += 1;
    certificateOpenControllerRef.current?.abort();
    certificateOpenControllerRef.current = null;
    certificatePreviewWindowRef.current?.close();
    certificatePreviewWindowRef.current = null;
    for (const kind of ['identity', 'bpjs']) {
      documentOpenRequestIdsRef.current[kind] += 1;
      documentOpenControllersRef.current[kind]?.abort();
      documentPreviewWindowsRef.current[kind]?.close();
    }
    documentOpenControllersRef.current = {};
    documentPreviewWindowsRef.current = {};
  }, []);

  useEffect(() => () => {
    cancelPending();
    revokeCertificateViewUrl();
    revokeDocumentViewUrls();
  }, [cancelPending, revokeCertificateViewUrl, revokeDocumentViewUrls]);

  const reset = useCallback((preview = null) => {
    cancelPending();
    revokeCertificateViewUrl();
    revokeDocumentViewUrls();
    setPhotoFile(null);
    setPhotoPreview(preview);
    setPhotoProcessing(false);
    setCertificateFile(null);
    setCertificateProcessing(false);
    setCertificateError('');
    setCertificateOpening(false);
    setIdentityDocumentFile(null);
    setBPJSDocumentFile(null);
    setDocumentProcessing({ identity: false, bpjs: false });
    setDocumentOpening({ identity: false, bpjs: false });
    setDocumentErrors({ identity: '', bpjs: '' });
  }, [cancelPending, revokeCertificateViewUrl, revokeDocumentViewUrls]);

  const handlePhotoChange = useCallback(async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingId = ++photoProcessingIdRef.current;
    setPhotoFile(null);
    setPhotoPreview(coachPhotoUrl);
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
  }, [coachPhotoUrl, setErrorMessage]);

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

  const handleDocumentChange = useCallback((kind) => async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const processingRef = kind === 'identity' ? identityProcessingIdRef : bpjsProcessingIdRef;
    const field = kind === 'identity' ? 'identity_document' : 'bpjs_document';
    const processingId = ++processingRef.current;
    if (kind === 'identity') {
      setIdentityDocumentFile(null);
    } else {
      setBPJSDocumentFile(null);
    }
    setDocumentErrors((previous) => ({ ...previous, [kind]: '' }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[field];
      return next;
    });
    setDocumentProcessing((previous) => ({ ...previous, [kind]: true }));

    try {
      const { extension } = validateSourceFile(file, { allowPDF: true });
      const processedFile = extension === 'pdf'
        ? file
        : await compressImageToWebP(file, { maxLongest: 1600 });
      if (processingId !== processingRef.current) return;
      if (kind === 'identity') {
        setIdentityDocumentFile(processedFile);
      } else {
        setBPJSDocumentFile(processedFile);
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

  const setDocumentError = useCallback((kind, message) => {
    setDocumentErrors((previous) => ({ ...previous, [kind]: message }));
  }, []);

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
      revokeCertificateViewUrl();
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
  }, [certificateOpening, coach?.certificate_document, revokeCertificateViewUrl]);

  const handleOpenStoredDocument = useCallback(async (kind) => {
    const documentUrl = kind === 'identity'
      ? coach?.identity_document
      : coach?.bpjs_document;
    if (!documentUrl || documentOpening[kind]) return;

    const requestId = ++documentOpenRequestIdsRef.current[kind];
    documentOpenControllersRef.current[kind]?.abort();
    const controller = new AbortController();
    documentOpenControllersRef.current[kind] = controller;

    const previewWindow = window.open('', '_blank');
    documentPreviewWindowsRef.current[kind] = previewWindow;
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = 'Memuat dokumen...';
      previewWindow.document.body.textContent = 'Memuat dokumen...';
    }
    setDocumentOpening((previous) => ({ ...previous, [kind]: true }));
    setDocumentErrors((previous) => ({ ...previous, [kind]: '' }));

    try {
      const response = await api.get(documentUrl, {
        responseType: 'blob',
        signal: controller.signal
      });
      if (requestId !== documentOpenRequestIdsRef.current[kind] || controller.signal.aborted) {
        previewWindow?.close();
        return;
      }
      if (documentViewUrlsRef.current[kind]) {
        URL.revokeObjectURL(documentViewUrlsRef.current[kind]);
      }
      const objectUrl = URL.createObjectURL(response.data);
      documentViewUrlsRef.current[kind] = objectUrl;
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
        requestId !== documentOpenRequestIdsRef.current[kind] ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }
      const label = kind === 'identity' ? 'KTP' : 'dokumen BPJS';
      setDocumentErrors((previous) => ({
        ...previous,
        [kind]: error.response?.status === 404
          ? `${label} tersimpan tidak ditemukan.`
          : `Gagal membuka ${label} tersimpan.`
      }));
    } finally {
      if (requestId === documentOpenRequestIdsRef.current[kind]) {
        delete documentOpenControllersRef.current[kind];
        delete documentPreviewWindowsRef.current[kind];
        setDocumentOpening((previous) => ({ ...previous, [kind]: false }));
      }
    }
  }, [coach?.bpjs_document, coach?.identity_document, documentOpening]);
  return {
    photoFile,
    photoPreview,
    photoProcessing,
    certificateFile,
    certificateProcessing,
    certificateError,
    certificateOpening,
    identityDocumentFile,
    bpjsDocumentFile,
    documentProcessing,
    documentOpening,
    documentErrors,
    canReuseStoredCertificate: Boolean(coach?.certificate_document),
    canReuseStoredIdentity: Boolean(coach?.identity_document),
    canReuseStoredBPJS: Boolean(coach?.bpjs_document),
    isAnyFileProcessing: photoProcessing || certificateProcessing || documentProcessing.identity || documentProcessing.bpjs,
    setCertificateError,
    setDocumentError,
    reset,
    cancelPending,
    handlePhotoChange,
    handleCertificateChange,
    handleDocumentChange,
    handleOpenStoredCertificate,
    handleOpenStoredDocument
  };
}
