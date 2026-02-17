import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered animations using Intersection Observer
 * @param {Object} options - IntersectionObserver options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.2
 * @param {string} options.rootMargin - Root margin, default "0px"
 * @param {boolean} options.triggerOnce - Only trigger once, default true
 * @returns {[React.RefObject, boolean]} - [ref to attach, isVisible state]
 */
export const useScrollAnimation = (options = {}) => {
  const { 
    threshold = 0.2, 
    rootMargin = '0px',
    triggerOnce = true 
  } = options;
  
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
};

export default useScrollAnimation;
