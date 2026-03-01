import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * Component to display protected images that require authentication.
 * Fetches image with credentials and displays as blob URL.
 */
export function ProtectedImage({ src, alt, className, style, fallback }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    let isMounted = true;
    
    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await api.get(src, {
          responseType: 'blob',
        });
        
        if (isMounted) {
          const blobUrl = URL.createObjectURL(response.data);
          setImageUrl(blobUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load protected image:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      // Cleanup blob URL
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <div className="animate-pulse bg-slate-200 w-full h-full rounded-full" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return fallback || (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#64748b' }}>
        ?
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      style={style}
    />
  );
}

export default ProtectedImage;
