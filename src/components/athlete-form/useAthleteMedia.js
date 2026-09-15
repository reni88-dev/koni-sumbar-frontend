import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { compressImageForUpload, prepareDocumentForUpload, validateSourceFile } from '../form-modal/mediaUtils';
import {
  fetchAndOpenStoredDocument,
  getAthleteStoredDocumentOpenError,
  revokeStoredDocumentObjectUrls,
} from './athleteDocumentPreview';
import { getAthleteAgeGroup } from './athleteFormModel';

export function useAthleteMedia({ athlete, setErrors, setErrorMessage }) {
  const photoProcessingIdRef = useRef(0);
  const identityProcessingIdRef = useRef(0);
  const bpjsProcessingIdRef = useRef(0);
  const documentOpenRequestIdsRef = useRef({ identity: 0, bpjs: 0 });
  const documentOpenControllersRef = useRef({});
  const documentPreviewWindowsRef = useRef({});
  const documentViewUrlsRef = useRef({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [identityDocumentFile, setIdentityDocumentFile] = useState(null);
  const [bpjsDocumentFile, setBPJSDocumentFile] = useState(null);
  const [documentProcessing, setDocumentProcessing] = useState({ identity: false, bpjs: false });
  const [documentOpening, setDocumentOpening] = useState({ identity: false, bpjs: false });
  const [documentErrors, setDocumentErrors] = useState({ identity: '', bpjs: '' });

  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
  }, [photoPreview]);

  const revokeDocumentViewUrls = useCallback(() => {
    revokeStoredDocumentObjectUrls(
      documentViewUrlsRef.current,
      (url) => URL.revokeObjectURL(url),
    );
    documentViewUrlsRef.current = {};
  }, []);

  const cancelPending = useCallback(() => {
    photoProcessingIdRef.current += 1;
    identityProcessingIdRef.current += 1;
    bpjsProcessingIdRef.current += 1;
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
    revokeDocumentViewUrls();
  }, [cancelPending, revokeDocumentViewUrls]);

  const reset = useCallback((preview = null) => {
    cancelPending();
    revokeDocumentViewUrls();
    setPhotoFile(null);
    setPhotoPreview(preview);
    setPhotoProcessing(false);
    setIdentityDocumentFile(null);
    setBPJSDocumentFile(null);
    setDocumentProcessing({ identity: false, bpjs: false });
    setDocumentOpening({ identity: false, bpjs: false });
    setDocumentErrors({ identity: '', bpjs: '' });
  }, [cancelPending, revokeDocumentViewUrls]);

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
      const compressed = await compressImageForUpload(file, { maxWidth: 800 });
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
      const processedFile = await prepareDocumentForUpload(file, { maxLongest: 1600 });
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

  const setDocumentError = useCallback((kind, message) => {
    setDocumentErrors((previous) => ({ ...previous, [kind]: message }));
  }, []);

  const handleOpenStoredDocument = useCallback(async (kind) => {
    const documentUrl = kind === 'identity'
      ? athlete?.identity_document
      : athlete?.bpjs_document;
    if (!documentUrl || documentOpening[kind]) return;

    const requestId = ++documentOpenRequestIdsRef.current[kind];
    documentOpenControllersRef.current[kind]?.abort();
    const controller = new AbortController();
    documentOpenControllersRef.current[kind] = controller;

    const label = kind === 'identity' ? 'dokumen identitas' : 'dokumen BPJS';
    const previewWindow = window.open('', '_blank');
    documentPreviewWindowsRef.current[kind] = previewWindow;
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title = `Memuat ${label}...`;
      previewWindow.document.body.textContent = `Memuat ${label}...`;
    }
    setDocumentOpening((previous) => ({ ...previous, [kind]: true }));
    setDocumentErrors((previous) => ({ ...previous, [kind]: '' }));

    try {
      const objectUrl = await fetchAndOpenStoredDocument({
        apiClient: api,
        documentUrl,
        signal: controller.signal,
        isCurrent: () => requestId === documentOpenRequestIdsRef.current[kind],
        previewWindow,
        createObjectURL: (blob) => URL.createObjectURL(blob),
        documentRef: document,
      });
      if (!objectUrl) return;
      if (documentViewUrlsRef.current[kind]) {
        URL.revokeObjectURL(documentViewUrlsRef.current[kind]);
      }
      documentViewUrlsRef.current[kind] = objectUrl;
    } catch (error) {
      previewWindow?.close();
      if (
        requestId !== documentOpenRequestIdsRef.current[kind] ||
        error.name === 'CanceledError' ||
        error.code === 'ERR_CANCELED'
      ) {
        return;
      }
      setDocumentErrors((previous) => ({
        ...previous,
        [kind]: getAthleteStoredDocumentOpenError(kind, error.response?.status),
      }));
    } finally {
      if (requestId === documentOpenRequestIdsRef.current[kind]) {
        delete documentOpenControllersRef.current[kind];
        delete documentPreviewWindowsRef.current[kind];
        setDocumentOpening((previous) => ({ ...previous, [kind]: false }));
      }
    }
  }, [athlete?.bpjs_document, athlete?.identity_document, documentOpening]);

  return {
    photoFile,
    photoPreview,
    photoProcessing,
    identityDocumentFile,
    bpjsDocumentFile,
    documentProcessing,
    documentOpening,
    documentErrors,
    isAnyFileProcessing: photoProcessing || documentProcessing.identity || documentProcessing.bpjs,
    setDocumentError,
    reset,
    cancelPending,
    invalidateIdentityForAgeChange,
    handlePhotoChange,
    handleDocumentChange,
    handleOpenStoredDocument
  };
}
