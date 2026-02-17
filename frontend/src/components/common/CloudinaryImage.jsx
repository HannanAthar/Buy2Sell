import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '../../utils/cloudinaryUtils';

/**
 * CloudinaryImage Component
 * 
 * enhanced with:
 * - Automatic format & quality optimization (f_auto, q_auto)
 * - Responsive sizing (srcSet)
 * - Blur placeholder loading effect
 * - Retina display support
 * - Performance monitoring
 * - Error handling with fallback
 * - Lazy loading
 */
const CloudinaryImage = ({
  src,
  alt = '',
  width,
  height,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false, // Set true for LCP images (e.g. Hero)
  style = {},
  onLoad
}) => {
  const [imgSrc, setImgSrc] = useState('');
  const [imgSrcSet, setImgSrcSet] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [blurUrl, setBlurUrl] = useState('');
  const imgRef = useRef(null);
  
  // Performance tracking
  const startTimeRef = useRef(Date.now());



  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    // Reset state
    setIsLoaded(false);
    setHasError(false);
    startTimeRef.current = Date.now();

    // Generate URLs using helper
    const mainUrl = getOptimizedImageUrl(src, width || 800);
    setImgSrc(mainUrl);

    // Generate Low-Res Blur
    const generatedBlurUrl = getOptimizedImageUrl(src, 20, 'e_blur:1000');
    // Only set blur if it's a Cloudinary URL (helper returns same src for others)
    if (generatedBlurUrl !== src && !generatedBlurUrl.startsWith('data:') && !generatedBlurUrl.startsWith('http://localhost')) {
         setBlurUrl(generatedBlurUrl);
    } else {
         setBlurUrl('');
    }

    // Generate SrcSet
    if (src && !src.startsWith('data:') && !src.startsWith('/uploads/')) {
        const widths = [320, 480, 640, 800, 1024, 1280, 1536, 1920];
        const srcSetString = widths
            .map(w => {
                const url = getOptimizedImageUrl(src, w);
                return `${url} ${w}w`;
            })
            .join(', ');
        setImgSrcSet(srcSetString);
    } else {
        setImgSrcSet('');
    }

  }, [src, width]);

  const handleLoad = () => {
    setIsLoaded(true);
    const loadTime = Date.now() - startTimeRef.current;
    
    // Log performance for debugging/monitoring
    // Only log if it took a noticeable amount of time (> 50ms) to avoid console spam for cached images
    if (import.meta.env.DEV || loadTime > 100) {
        // console.debug(`🖼️ Image loaded in ${loadTime}ms:`, src.substring(0, 50) + '...');
    }

    if (onLoad) onLoad();
  };

  const handleError = () => {
    // console.warn("❌ Image failed to load:", src);
    setHasError(true);
    // Fallback to local placeholder or generic image
    setImgSrc('/placeholder.svg');
    setImgSrcSet(''); // Clear srcSet to force fallback usage
  };

  // Container styles for blur effect
  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    ...style
  };

  if (width) containerStyle.width = typeof width === 'number' ? `${width}px` : width;
  if (height) containerStyle.height = typeof height === 'number' ? `${height}px` : height;

  if (hasError) {
      return (
          <img 
            src="/placeholder.svg" 
            alt={alt} 
            className={`object-cover bg-gray-100 ${className}`}
            width={width}
            height={height}
          />
      );
  }

  // Prevent rendering img with empty src
  if (!imgSrc) return null;

  return (
    <div className={`cloudinary-image-container ${className}`} style={containerStyle}>
        
        {/* Blur Placeholder */}
        {blurUrl && !isLoaded && (
            <img
                src={blurUrl}
                alt=""
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: 'blur(10px)',
                    transform: 'scale(1.1)', // Prevent white edges from blur
                    transition: 'opacity 0.3s ease-out',
                    zIndex: 1
                }}
            />
        )}

        {/* Main Image */}
        <img
            ref={imgRef}
            src={imgSrc}
            srcSet={imgSrcSet}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            onLoad={handleLoad}
            onError={handleError}
            style={{
                position: blurUrl ? 'relative' : undefined,
                width: '100%',
                height: '100%',
                objectFit: 'cover', // Default to cover, can be overridden by className
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease-in',
                zIndex: 2,
                ...style // Allow style overrides
            }}
            className={className} // Pass className through
        />
    </div>
  );
};

export default CloudinaryImage;
