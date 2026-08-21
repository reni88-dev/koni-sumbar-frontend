import { useEffect, useState } from 'react';
import api from '../api/axios';

function ImageFallback({ className, style, fallback }) {
  return fallback || (
    <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#64748b', ...style }}>
      Gambar tidak tersedia
    </div>
  );
}

function AuthenticatedImage({ src, alt, className, style, fallback, imageProps }) {
  const [state, setState] = useState({ imageUrl: null, loading: true, error: false });

  useEffect(() => {
    const controller = new AbortController();
    let blobUrl = null;
    let active = true;

    api.get(src, { responseType: 'blob', signal: controller.signal })
      .then((response) => {
        if (!active) return;
        blobUrl = URL.createObjectURL(response.data);
        setState({ imageUrl: blobUrl, loading: false, error: false });
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return;
        setState({ imageUrl: null, loading: false, error: true });
      });

    return () => {
      active = false;
      controller.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (state.loading) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', ...style }}>
        <div className="h-full w-full animate-pulse bg-slate-200" />
      </div>
    );
  }

  if (state.error || !state.imageUrl) {
    return <ImageFallback className={className} style={style} fallback={fallback} />;
  }

  return <img src={state.imageUrl} alt={alt} className={className} style={style} {...imageProps} />;
}

export function ProtectedImage({ src, alt, className, style, fallback, ...imageProps }) {
  if (!src) return <ImageFallback className={className} style={style} fallback={fallback} />;
  return (
    <AuthenticatedImage
      key={src}
      src={src}
      alt={alt}
      className={className}
      style={style}
      fallback={fallback}
      imageProps={imageProps}
    />
  );
}

export default ProtectedImage;
