import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IMAGE_ACCEPT,
  compressImageToWebP,
  validateSourceFile,
} from '../form-modal/mediaUtils';

const MAX_SCREENSHOTS = 5;
const MAX_COMPRESSED_SIZE = 5 * 1024 * 1024;

export function useComplaintScreenshots() {
  const [items, setItems] = useState([]);
  const [selectionError, setSelectionError] = useState('');
  const urlsRef = useRef(new Set());
  const mountedRef = useRef(true);
  const cancelledRef = useRef(new Set());
  const sequenceRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    const objectUrls = urlsRef.current;
    return () => {
      mountedRef.current = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.clear();
    };
  }, []);

  const remove = useCallback((id) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.status === 'processing') cancelledRef.current.add(id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        urlsRef.current.delete(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
    setSelectionError('');
  }, []);

  const clear = useCallback(() => {
    setItems((current) => {
      current.forEach((item) => {
        if (item.status === 'processing') cancelledRef.current.add(item.id);
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          urlsRef.current.delete(item.previewUrl);
        }
      });
      return [];
    });
    setSelectionError('');
  }, []);

  const addFiles = useCallback(async (fileList) => {
    const sources = Array.from(fileList || []);
    setSelectionError('');
    if (!sources.length) return;

    if (items.length + sources.length > MAX_SCREENSHOTS) {
      setSelectionError(`Maksimal ${MAX_SCREENSHOTS} screenshot. Hapus file lain sebelum menambahkan.`);
      return;
    }

    for (const source of sources) {
      const id = `complaint-shot-${Date.now()}-${sequenceRef.current++}`;
      try {
        validateSourceFile(source, { allowPDF: false });
      } catch (error) {
        setItems((current) => [...current, {
          id, originalName: source.name, status: 'error', error: error.message,
        }]);
        continue;
      }

      setItems((current) => [...current, {
        id, originalName: source.name, sourceSize: source.size, status: 'processing',
      }]);
      try {
        const compressed = await compressImageToWebP(source, { maxLongest: 1600 });
        if (cancelledRef.current.has(id)) {
          cancelledRef.current.delete(id);
          continue;
        }
        if (compressed.size > MAX_COMPRESSED_SIZE) {
          throw new Error('Hasil kompresi masih lebih dari 5 MB. Gunakan screenshot dengan ukuran lebih kecil.');
        }
        const previewUrl = URL.createObjectURL(compressed);
        urlsRef.current.add(previewUrl);
        if (!mountedRef.current) {
          URL.revokeObjectURL(previewUrl);
          urlsRef.current.delete(previewUrl);
          return;
        }
        setItems((current) => current.map((item) => item.id === id
          ? { ...item, file: compressed, resultSize: compressed.size, previewUrl, status: 'ready' }
          : item));
      } catch (error) {
        if (!mountedRef.current) return;
        setItems((current) => current.map((item) => item.id === id
          ? { ...item, status: 'error', error: error.message }
          : item));
      }
    }
  }, [items.length]);

  return {
    items,
    addFiles,
    remove,
    clear,
    selectionError,
    accept: IMAGE_ACCEPT,
    isProcessing: items.some((item) => item.status === 'processing'),
    readyFiles: items.filter((item) => item.status === 'ready').map((item) => item.file),
    hasErrors: items.some((item) => item.status === 'error'),
    maxFiles: MAX_SCREENSHOTS,
  };
}
