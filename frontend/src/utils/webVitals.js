/**
 * Web Vitals Monitoring Utility
 * Tracks Core Web Vitals: LCP, FID, CLS, TTFB, INP
 */
import { onCLS, onINP, onLCP, onTTFB } from 'web-vitals';

// Performance thresholds (Good / Needs Improvement / Poor)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint (ms)
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift (score)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
};

/**
 * Get rating based on value and thresholds
 */
const getRating = (name, value) => {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'unknown';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Format metric for logging
 */
const formatMetric = (metric) => {
  const rating = getRating(metric.name, metric.value);
  const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
  
  return {
    name: metric.name,
    value: metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value),
    rating,
    emoji,
    id: metric.id,
    navigationType: metric.navigationType,
  };
};

/**
 * Log metric to console (development)
 */


/**
 * Send metric to analytics endpoint (production)
 */
const sendToAnalytics = async (metric) => {
  const formatted = formatMetric(metric);
  
  // Only send in production
  if (import.meta.env.PROD) {
    try {
      // You can replace this with your analytics endpoint
      // e.g., Google Analytics, custom API, etc.
      const body = JSON.stringify({
        name: formatted.name,
        value: formatted.value,
        rating: formatted.rating,
        id: formatted.id,
        page: window.location.pathname,
        timestamp: Date.now(),
      });
      
      // Use sendBeacon if available for reliability during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', body);
      } else {
        fetch('/api/analytics/vitals', {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        });
      }
    } catch (error) {
      console.error('Failed to send web vital:', error);
    }
  }
};

/**
 * Combined handler for all metrics
 */
const handleMetric = (metric) => {
  // logMetric(metric); // Removed logging
  sendToAnalytics(metric);
};

/**
 * Initialize Web Vitals tracking
 * Call this once in your app entry point
 */
export const initWebVitals = () => {
  // Core Web Vitals
  onLCP(handleMetric);
  onCLS(handleMetric);
  onINP(handleMetric);
  
  // Other useful metrics
  onTTFB(handleMetric);
  
  console.log('📊 Web Vitals monitoring initialized');
};

/**
 * Get Navigation Timing metrics
 */
export const getNavigationTiming = () => {
  if (!window.performance) return null;
  
  const timing = performance.getEntriesByType('navigation')[0];
  if (!timing) return null;
  
  return {
    // DNS lookup time
    dns: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
    // TCP connection time
    tcp: Math.round(timing.connectEnd - timing.connectStart),
    // Request to response time
    request: Math.round(timing.responseEnd - timing.requestStart),
    // DOM content loaded
    domContentLoaded: Math.round(timing.domContentLoadedEventEnd - timing.fetchStart),
    // Page load complete
    load: Math.round(timing.loadEventEnd - timing.fetchStart),
    // First paint
    firstPaint: getFirstPaint(),
  };
};

/**
 * Get First Paint timing
 */
const getFirstPaint = () => {
  const paintEntries = performance.getEntriesByType('paint');
  const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
  return fpEntry ? Math.round(fpEntry.startTime) : null;
};

/**
 * Log all resource loading times (for debugging)
 */
export const logResourceTimings = () => {
  if (!import.meta.env.DEV) return;
  
  const resources = performance.getEntriesByType('resource');
  const slowResources = resources
    .filter(r => r.duration > 500)
    .map(r => ({
      name: r.name.split('/').pop(),
      type: r.initiatorType,
      duration: Math.round(r.duration),
      size: r.transferSize ? Math.round(r.transferSize / 1024) + 'KB' : 'N/A',
    }))
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);
  
  if (slowResources.length > 0) {
    console.log('🐢 Slow resources (>500ms):');
    console.table(slowResources);
  }
};

export default { initWebVitals, getNavigationTiming, logResourceTimings };
