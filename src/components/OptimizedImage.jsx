import React from 'react';

export const OptimizedImage = ({ 
  src, 
  alt, 
  width = 800, 
  className = "",
  priority = false 
}) => {
  const optimizedSrc = src?.includes('unsplash.com') 
    ? (src.includes('?') 
        ? `${src}&w=${width}&q=80&auto=format&fit=crop` 
        : `${src}?w=${width}&q=80&auto=format&fit=crop`)
    : src;

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
};

export default OptimizedImage;