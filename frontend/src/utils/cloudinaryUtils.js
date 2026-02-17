/**
 * Cloudinary Utility Functions
 */

const CLOUD_NAME = import.meta.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dnnkoqxct';
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

/**
 * Generates an optimized Cloudinary URL for a given source
 * @param {string} src - The source image (URL, path, or ID)
 * @param {number} width - Target width
 * @param {string} customTrans - Additional transformations
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (src, width = 'auto', customTrans = '') => {
  if (!src) return '/placeholder.svg';

  // 1. Handle already optimized or external URLs
  if (src.startsWith('http')) {
    if (src.includes('res.cloudinary.com') && !src.includes('/upload/v')) {
       // Already a cloudinary URL, maybe try to inject params if possible, 
       // but safer to return as is if complex
       return src;
    }
    if (!src.includes('res.cloudinary.com')) {
      return src; // External non-cloudinary
    }
  }
  
  // 2. Handle Local Legacy & Public Assets
  if (src.startsWith('/')) {
    if (src.startsWith('/uploads/')) {
      return `http://localhost:5000${src}`;
    }
    return src; // Return other local paths as-is (e.g. /12.webp)
  }
  
  if (src.startsWith('data:')) return src;

  // 3. Extract Public ID
  let publicId = src;
  if (src.startsWith('http') && src.includes('res.cloudinary.com')) {
     const parts = src.split('/upload/');
     if (parts.length > 1) {
         publicId = parts[1];
     }
  }
  
  if (publicId.startsWith('/')) publicId = publicId.substring(1);

  // 4. Construct URL
  const baseTrans = 'f_auto,q_auto,c_limit';
  const widthTrans = width === 'auto' ? '' : `,w_${width}`;
  const transformations = `${baseTrans}${widthTrans}${customTrans ? ',' + customTrans : ''}`;

  return `${BASE_URL}/${transformations}/${publicId}`;
};
