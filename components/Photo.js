'use client';

import { useEffect, useState } from 'react';
import { getPhoto } from '@/lib/storage';

// Φορτώνει μια αποθηκευμένη φωτογραφία και δίνει URL για <img>.
export function usePhotoUrl(id) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!id) return setUrl(null);
    let alive = true;
    let objectUrl = null;
    getPhoto(id).then((blob) => {
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return url;
}

export default function Photo({ id, alt = '', className = '', onClick }) {
  const url = usePhotoUrl(id);
  if (!url) return <span className={`ph ${className}`} aria-hidden="true" />;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={url} alt={alt} className={className} />;
  return onClick ? <button type="button" className="ph-btn" onClick={onClick} aria-label={alt}>{img}</button> : img;
}
